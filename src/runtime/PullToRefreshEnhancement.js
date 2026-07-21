const React = require("react");
const RN = require("react-native");

let installed = false;

function flattenStyle(style) {
  if (!style) return {};
  if (Array.isArray(style)) {
    return style.reduce(
      (result, item) => ({ ...result, ...flattenStyle(item) }),
      {}
    );
  }
  return typeof style === "object" ? style : {};
}

function componentName(element) {
  if (!React.isValidElement(element)) return "";
  const type = element.type;
  return String(type?.displayName || type?.name || "");
}

function isDashboardContentScroll(props, children) {
  if (props?.refreshControl || props?.__okaiPullRefreshEnhanced) {
    return false;
  }

  const style = flattenStyle(props?.style);
  const contentStyle = flattenStyle(props?.contentContainerStyle);

  if (style.flex !== 1 || contentStyle.flexGrow !== 1) {
    return false;
  }

  const childList = React.Children.toArray(children);
  const hasOtaBanner = childList.some(
    (child) => componentName(child) === "OtaStatusBanner"
  );

  // OtaStatusBanner is the exact dashboard marker. The fallback keeps this
  // compatible with minified production bundles where function names may be
  // shortened, while still avoiding normal tab ScrollViews that use padding.
  const productionFallback =
    childList.length >= 2 &&
    contentStyle.padding == null &&
    contentStyle.paddingBottom == null;

  return hasOtaBanner || productionFallback;
}

function collectRefreshCallbacks(node, output, depth = 0) {
  if (depth > 5 || !React.isValidElement(node)) return;

  const props = node.props || {};
  for (const propName of ["onPageRefresh", "onRefresh"]) {
    const callback = props[propName];
    if (typeof callback === "function" && !output.includes(callback)) {
      output.push(callback);
    }
  }

  React.Children.forEach(props.children, (child) => {
    collectRefreshCallbacks(child, output, depth + 1);
  });
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function installPullToRefreshEnhancement() {
  if (installed) return;
  installed = true;

  const previousCreateElement = React.createElement.bind(React);

  function DashboardPullRefreshScroll({
    scrollType,
    scrollProps,
    childNodes,
  }) {
    const [refreshing, setRefreshing] = React.useState(false);
    const [refreshVersion, setRefreshVersion] = React.useState(0);
    const aliveRef = React.useRef(true);

    React.useEffect(() => {
      aliveRef.current = true;
      return () => {
        aliveRef.current = false;
      };
    }, []);

    async function refreshCurrentPage() {
      if (refreshing) return;
      setRefreshing(true);

      try {
        const callbacks = [];
        React.Children.forEach(childNodes, (child) => {
          collectRefreshCallbacks(child, callbacks);
        });

        if (callbacks.length > 0) {
          await Promise.race([
            Promise.allSettled(
              callbacks.map((callback) =>
                Promise.resolve().then(() => callback())
              )
            ),
            delay(2500),
          ]);
        }

        // Every active tab loads its data in useEffect. Changing its key
        // remounts only the current page and keeps the selected tab open.
        if (aliveRef.current) {
          setRefreshVersion((value) => value + 1);
          await delay(300);
        }
      } finally {
        if (aliveRef.current) setRefreshing(false);
      }
    }

    const refreshedChildren = React.Children.toArray(childNodes).map(
      (child, index) => {
        if (!React.isValidElement(child)) return child;
        const oldKey = child.key == null ? index : child.key;
        return React.cloneElement(child, {
          key: `okai-refresh-${refreshVersion}-${oldKey}`,
        });
      }
    );

    const nativeRefreshControl = previousCreateElement(RN.RefreshControl, {
      refreshing,
      onRefresh: refreshCurrentPage,
      colors: ["#7c6deb", "#00d4a0"],
      tintColor: "#7c6deb",
      progressBackgroundColor: "#13131f",
      title: refreshing ? "Refreshing..." : undefined,
      titleColor: "#7c6deb",
    });

    return previousCreateElement(
      scrollType,
      {
        ...scrollProps,
        __okaiPullRefreshEnhanced: true,
        refreshControl: nativeRefreshControl,
        alwaysBounceVertical: true,
        overScrollMode: "always",
        nestedScrollEnabled: true,
      },
      ...refreshedChildren
    );
  }

  function patchedCreateElement(type, props, ...children) {
    const safeProps = props || {};

    if (
      type === RN.ScrollView &&
      isDashboardContentScroll(safeProps, children)
    ) {
      return previousCreateElement(DashboardPullRefreshScroll, {
        scrollType: type,
        scrollProps: safeProps,
        childNodes: children,
      });
    }

    return previousCreateElement(type, safeProps, ...children);
  }

  React.createElement = patchedCreateElement;
}

module.exports = { installPullToRefreshEnhancement };
