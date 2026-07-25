const React = require("react");
const { ScrollView } = require("react-native");
const SelectedBrokerPanelModule = require("../components/SelectedBrokerOverlay");
const SelectedBrokerPanel =
  SelectedBrokerPanelModule.default || SelectedBrokerPanelModule;

let installed = false;
let injecting = false;

function textFromNode(node, depth = 0) {
  if (depth > 7 || node == null || node === false) return "";
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map((item) => textFromNode(item, depth + 1)).join(" ");
  }
  if (React.isValidElement(node)) {
    return textFromNode(node.props?.children, depth + 1);
  }
  return "";
}

function isBrokerToolsScroll(children) {
  const text = textFromNode(children).toLowerCase();
  return (
    text.includes("connect broker") ||
    text.includes("broker connect karo")
  );
}

function installBrokerPanelPlacementEnhancement() {
  if (installed) return;
  installed = true;

  const originalCreateElement = React.createElement.bind(React);

  React.createElement = function brokerPanelAwareCreateElement(
    type,
    props,
    ...children
  ) {
    if (
      !injecting &&
      type === ScrollView &&
      isBrokerToolsScroll(children)
    ) {
      injecting = true;
      let panel;
      try {
        panel = originalCreateElement(SelectedBrokerPanel, {
          key: "okai-selected-broker-panel",
        });
      } finally {
        injecting = false;
      }
      return originalCreateElement(type, props, panel, ...children);
    }

    return originalCreateElement(type, props, ...children);
  };
}

module.exports = {
  installBrokerPanelPlacementEnhancement,
};
