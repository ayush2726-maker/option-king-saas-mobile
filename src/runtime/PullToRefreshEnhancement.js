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

function isDashboardContentScroll(props, children) {
  if (props?.horizontal || props?.__okaiDashboardHost) return false;

  const style = flattenStyle(props?.style);
  const contentStyle = flattenStyle(props?.contentContainerStyle);

  if (style.flex !== 1 || contentStyle.flexGrow !== 1) {
    return false;
  }

  const childList = React.Children.toArray(children);
  const hasOtaBanner = childList.some(
    (child) => componentName(child) === "OtaStatusBanner"
  );

  const productionFallback =
    childList.length >= 2 &&
    contentStyle.padding == null &&
    contentStyle.paddingBottom == null;

  return hasOtaBanner || productionFallback;
}

function isTabRootScroll(props) {
  if (
    props?.horizontal ||
    props?.__okaiPullRefreshEnhanced ||
    props?.__okaiDashboardHost
  ) {
    return false;
  }

  const style = flattenStyle(props?.style);
  const contentStyle = flattenStyle(props?.contentContainerStyle);
  const bottomPadding = Number(contentStyle.paddingBottom || 0);

  return style.flex === 1 && bottomPadding >= 80;
}

function collectRefreshCallbacks(node, output, depth = 0) {
  if (depth > 6 || !React.isValidElement(node)) return;

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

function refreshControlHandler(refreshControl) {
  if (!React.isValidElement(refreshControl)) return null;
  return typeof refreshControl.props?.onRefresh === "function"
    ? refreshControl.props.onRefresh
    : null;
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

  function DashboardContentHost({ childNodes }) {
    const callbacksRef = React.useRef([]);
    callbacksRef.current = [];
    React.Children.forEach(childNodes, (child) => {
      collectRefreshCallbacks(child, callbacksRef.current);
    });

    React.useEffect(() => {
      dashboardRefreshHandler = async () => {
        const callbacks = callbacksRef.current.slice();
        if (!callbacks.length) return;
        await Promise.race([
          Promise.allSettled(
            callbacks.map((callback) =>
              Promise.resolve().then(() => callback())
            )
          ),
          delay(4000),
        ]);
      };

      return () => {
        dashboardRefreshHandler = null;
      };
    }, []);

    // The old layout used a ScrollView outside every tab, while tabs already
    // had their own ScrollViews. That nested pair swallowed pull gestures and
    // sometimes made refresh appear stuck. A plain flex View leaves scrolling
    // and RefreshControl to the active tab only.
    return previousCreateElement(
      RN.View,
      {
        style: { flex: 1 },
        __okaiDashboardHost: true,
      },
      ...React.Children.toArray(childNodes)
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
      if (aliveRef.current) setRefreshing(true);

      try {
        const ownHandler = refreshControlHandler(
          scrollProps?.refreshControl
        );

        if (typeof ownHandler === "function") {
          await Promise.race([
            Promise.resolve().then(() => ownHandler()),
            delay(5000),
          ]);
        } else if (typeof dashboardRefreshHandler === "function") {
          await Promise.race([
            dashboardRefreshHandler(),
            delay(5000),
          ]);
        } else {
          const callbacks = [];
          React.Children.forEach(childNodes, (child) => {
            collectRefreshCallbacks(child, callbacks);
          });
          await Promise.race([
            Promise.allSettled(
              callbacks.map((callback) =>
                Promise.resolve().then(() => callback())
              )
            ),
            delay(3000),
          ]);
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
        nestedScrollEnabled: false,
      },
      ...React.Children.toArray(childNodes)
    );
  }

  function transformElement(type, props, children) {
    const safeProps = props || {};

    if (
      type === RN.ScrollView &&
      isDashboardContentScroll(safeProps, children)
    ) {
      return previousCreateElement(DashboardContentHost, {
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

    return null;
  }

  React.createElement = function patchedCreateElement(
    type,
    props,
    ...children
  ) {
    return (
      transformElement(type, props, children) ||
      previousCreateElement(type, props || {}, ...children)
    );
  };

  // Expo may compile JSX through react/jsx-runtime instead of
  // React.createElement. Patch both paths so release builds behave like dev.
  try {
    const jsxRuntime = require("react/jsx-runtime");
    ["jsx", "jsxs"].forEach((key) => {
      const original = jsxRuntime[key];
      if (typeof original !== "function") return;

      jsxRuntime[key] = function patchedJsx(type, props, reactKey) {
        const children = React.Children.toArray(props?.children);
        const transformed = transformElement(type, props, children);
        if (transformed) return transformed;
        return original(type, props, reactKey);
      };
    });
  } catch (_) {}
}

module.exports = { installPullToRefreshEnhancement };
