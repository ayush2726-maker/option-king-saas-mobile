const React = require("react");
const RN = require("react-native");

let installed = false;
let dashboardRefreshHandler = null;

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

function isAlreadyEnhanced(props) {
  return Boolean(
    props?.refreshControl || props?.__okaiPullRefreshEnhanced
  );
}

function isDashboardContentScroll(props, children) {
  if (isAlreadyEnhanced(props)) return false;

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
  // shortened, while avoiding normal tab ScrollViews that use page padding.
  const productionFallback =
    childList.length >= 2 &&
    contentStyle.padding == null &&
    contentStyle.paddingBottom == null;

  return hasOtaBanner || productionFallback;
}

function isTabRootScroll(props) {
  if (isAlreadyEnhanced(props) || props?.horizontal) return false;

  const style = flattenStyle(props?.style);
  const contentStyle = flattenStyle(props?.contentContainerStyle);
  const bottomPadding = Number(contentStyle.paddingBottom || 0);

  // Every main Option King tab uses a full-height vertical ScrollView with
  // bottom padding for the fixed navigation bar. Child chart scrollers do not.
  return style.flex === 1 && bottomPadding >= 80;
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

  function makeRefreshControl(refreshing, onRefresh) {
    return previousCreateElement(RN.RefreshControl, {
      refreshing,
      onRefresh,
      colors: ["#7c6deb", "#00d4a0"],
      tintColor: "#7c6deb",
      progressBackgroundColor: "#13131f",
      title: refreshing ? "Refreshing..." : undefined,
      titleColor: "#7c6deb",
    });
  }

  function DashboardPullRefreshScroll({
    scrollType,
    scrollProps,
    childNodes,
  }) {
    const [refreshing, setRefreshing] = React.useState(false);
    const [refreshVersion, setRefreshVersion] = React.useState(0);
    const aliveRef = React.useRef(true);
    const busyRef = React.useRef(false);
    const childNodesRef = React.useRef(childNodes);
    childNodesRef.current = childNodes;

    async function refreshCurrentPage() {
      if (busyRef.current) return;
      busyRef.current = true;
      if (aliveRef.current) setRefreshing(true);

      try {
        const callbacks = [];
        React.Children.forEach(childNodesRef.current, (child) => {
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
          await delay(350);
        }
      } finally {
        busyRef.current = false;
        if (aliveRef.current) setRefreshing(false);
      }
    }

    React.useEffect(() => {
      aliveRef.current = true;
      dashboardRefreshHandler = refreshCurrentPage;

      return () => {
        aliveRef.current = false;
        if (dashboardRefreshHandler === refreshCurrentPage) {
          dashboardRefreshHandler = null;
        }
      };
    }, []);

    const refreshedChildren = React.Children.toArray(childNodes).map(
      (child, index) => {
        if (!React.isValidElement(child)) return child;
        const oldKey = child.key == null ? index : child.key;
        return React.cloneElement(child, {
          key: `okai-refresh-${refreshVersion}-${oldKey}`,
        });
      }
    );

    return previousCreateElement(
      scrollType,
      {
        ...scrollProps,
        __okaiPullRefreshEnhanced: true,
        refreshControl: makeRefreshControl(
          refreshing,
          refreshCurrentPage
        ),
        alwaysBounceVertical: true,
        overScrollMode: "always",
        nestedScrollEnabled: true,
      },
      ...refreshedChildren
    );
  }

  function TabPullRefreshScroll({
    scrollType,
    scrollProps,
    childNodes,
  }) {
    const [refreshing, setRefreshing] = React.useState(false);
    const aliveRef = React.useRef(true);
    const busyRef = React.useRef(false);

    React.useEffect(() => {
      aliveRef.current = true;
      return () => {
        aliveRef.current = false;
      };
    }, []);

    async function refreshFromActiveTab() {
      if (busyRef.current) return;
      busyRef.current = true;
      setRefreshing(true);

      try {
        if (typeof dashboardRefreshHandler === "function") {
          await dashboardRefreshHandler();
        } else {
          await delay(500);
        }
      } finally {
        busyRef.current = false;
        if (aliveRef.current) setRefreshing(false);
      }
    }

    return previousCreateElement(
      scrollType,
      {
        ...scrollProps,
        __okaiPullRefreshEnhanced: true,
        refreshControl: makeRefreshControl(
          refreshing,
          refreshFromActiveTab
        ),
        alwaysBounceVertical: true,
        overScrollMode: "always",
        nestedScrollEnabled: true,
      },
      ...React.Children.toArray(childNodes)
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

    if (type === RN.ScrollView && isTabRootScroll(safeProps)) {
      return previousCreateElement(TabPullRefreshScroll, {
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
