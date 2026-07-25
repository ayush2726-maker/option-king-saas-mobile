const React = require("react");
const ReactNative = require("react-native");
const AsyncStorageModule = require("@react-native-async-storage/async-storage");
const AsyncStorage = AsyncStorageModule.default || AsyncStorageModule;

const { ActivityIndicator, Linking, Text, TouchableOpacity, View } = ReactNative;
const SAAS_URL = "https://option-king-saas-production.up.railway.app";
const STORAGE_KEY = "okai_paytm_link_order_id";

let automaticJsxRuntime = null;
let automaticJsxDevRuntime = null;
try {
  automaticJsxRuntime = require("react/jsx-runtime");
} catch (_) {}
try {
  automaticJsxDevRuntime = require("react/jsx-dev-runtime");
} catch (_) {}

let installed = false;
let injecting = false;

function textFromNode(node, depth = 0) {
  if (depth > 9 || node == null || node === false) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) {
    return node.map((item) => textFromNode(item, depth + 1)).join(" ");
  }
  if (React.isValidElement(node)) {
    return textFromNode(node.props?.children, depth + 1);
  }
  return "";
}

function componentName(type) {
  return String(type?.displayName || type?.name || "").toLowerCase();
}

function isCardType(type) {
  return typeof type === "function" && componentName(type) === "card";
}

function isPaymentCard(children) {
  const text = textFromNode(children).toLowerCase();
  return (
    text.includes("okai monthly plan") &&
    (text.includes("phonepe / upi") || text.includes("phonepe/upi"))
  );
}

function containsPaytmPanel(node, depth = 0) {
  if (depth > 8 || node == null) return false;
  if (Array.isArray(node)) {
    return node.some((item) => containsPaytmPanel(item, depth + 1));
  }
  if (React.isValidElement(node)) {
    if (node.type === PaytmPaymentPanel) return true;
    return containsPaytmPanel(node.props?.children, depth + 1);
  }
  return false;
}

async function api(path, options = {}) {
  const token = await AsyncStorage.getItem("saas_token");
  if (!token) throw new Error("Login required");
  const response = await fetch(SAAS_URL + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
      ...(options.headers || {}),
    },
  });
  let data = {};
  try {
    data = await response.json();
  } catch (_) {}
  if (!response.ok) {
    throw new Error(data?.detail || data?.message || "Paytm request failed");
  }
  return data;
}

function PaytmPaymentPanel() {
  const [available, setAvailable] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [orderId, setOrderId] = React.useState("");
  const [state, setState] = React.useState("");
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    let active = true;
    Promise.all([
      api("/subscription/paytm/config").catch(() => ({ available: false })),
      AsyncStorage.getItem(STORAGE_KEY).catch(() => ""),
    ]).then(([config, savedOrder]) => {
      if (!active) return;
      setAvailable(config?.available === true);
      if (savedOrder) setOrderId(savedOrder);
    });
    return () => {
      active = false;
    };
  }, []);

  async function startPayment() {
    if (loading) return;
    setLoading(true);
    setMessage("");
    setState("");
    try {
      const data = await api("/subscription/paytm/create-link", {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (!data?.checkout_url || !data?.merchant_order_id) {
        throw new Error("Paytm payment link was not returned");
      }
      await AsyncStorage.setItem(STORAGE_KEY, data.merchant_order_id);
      setOrderId(data.merchant_order_id);
      setState("PENDING");
      setMessage(
        "Paytm payment link is opening. After payment, return and tap Check Paytm Status."
      );
      await Linking.openURL(data.checkout_url);
    } catch (error) {
      setMessage(error?.message || "Paytm payment link did not open.");
    } finally {
      setLoading(false);
    }
  }

  async function checkPayment() {
    if (loading) return;
    const savedOrder = orderId || (await AsyncStorage.getItem(STORAGE_KEY));
    if (!savedOrder) {
      setMessage("Start the Paytm payment first.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const data = await api(
        `/subscription/paytm/status/${encodeURIComponent(savedOrder)}`
      );
      const nextState = String(data?.state || "PENDING").toUpperCase();
      setState(nextState);
      if (data?.subscription_active) {
        setMessage("✅ Paytm payment verified. Your 30-day plan is active.");
        await AsyncStorage.removeItem(STORAGE_KEY);
        setOrderId("");
      } else {
        setMessage("Payment is still pending. Check Paytm/UPI and refresh again.");
      }
    } catch (error) {
      setMessage(error?.message || "Could not check Paytm payment status.");
    } finally {
      setLoading(false);
    }
  }

  return React.createElement(
    View,
    {
      style: {
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: "#2b3150",
      },
    },
    React.createElement(
      Text,
      { style: { color: "#e8e8f0", fontSize: 14, fontWeight: "900" } },
      "Pay with Paytm Payment Link"
    ),
    React.createElement(
      Text,
      {
        style: {
          color: "#9090ad",
          fontSize: 10,
          lineHeight: 15,
          marginTop: 4,
          marginBottom: 10,
        },
      },
      "A separate secure link is created for every payment. The plan activates only after server verification."
    ),
    React.createElement(
      TouchableOpacity,
      {
        onPress: startPayment,
        disabled: loading || !available,
        activeOpacity: 0.85,
        style: {
          minHeight: 46,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: available ? "#00baf2" : "#34384f",
          borderWidth: 1,
          borderColor: available ? "#51d5ff" : "#4a4f69",
          opacity: loading ? 0.75 : 1,
        },
      },
      loading
        ? React.createElement(ActivityIndicator, { color: "#ffffff", size: "small" })
        : React.createElement(
            Text,
            { style: { color: "#ffffff", fontSize: 12, fontWeight: "900" } },
            available ? "Pay ₹1,999 with Paytm" : "Paytm setup pending"
          )
    ),
    orderId
      ? React.createElement(
          TouchableOpacity,
          {
            onPress: checkPayment,
            disabled: loading,
            activeOpacity: 0.85,
            style: {
              minHeight: 42,
              marginTop: 9,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#182742",
              borderWidth: 1,
              borderColor: "#3b82f6",
            },
          },
          React.createElement(
            Text,
            { style: { color: "#77b7ff", fontSize: 11, fontWeight: "900" } },
            "Check Paytm Status"
          )
        )
      : null,
    orderId
      ? React.createElement(
          Text,
          {
            style: {
              color: "#777d98",
              fontSize: 9,
              marginTop: 6,
              textAlign: "center",
            },
          },
          `Order: ${orderId}${state ? ` • ${state}` : ""}`
        )
      : null,
    message
      ? React.createElement(
          Text,
          {
            style: {
              color: message.startsWith("✅") ? "#39d98a" : "#f4c95d",
              fontSize: 10,
              lineHeight: 15,
              marginTop: 9,
            },
          },
          message
        )
      : null
  );
}

function appendPanel(children, baseCreateElement) {
  if (containsPaytmPanel(children)) return children;
  injecting = true;
  let panel;
  try {
    panel = baseCreateElement(PaytmPaymentPanel, {
      key: "okai-paytm-payment-panel",
    });
  } finally {
    injecting = false;
  }
  return Array.isArray(children) ? [...children, panel] : [children, panel];
}

function patchAutomaticRuntime(runtime, baseCreateElement) {
  if (!runtime || typeof runtime !== "object") return;
  for (const functionName of ["jsx", "jsxs", "jsxDEV"]) {
    const original = runtime?.[functionName];
    if (typeof original !== "function") continue;
    runtime[functionName] = function paytmAwareJsx(type, props, ...rest) {
      const children = props?.children;
      if (
        !injecting &&
        isCardType(type) &&
        isPaymentCard(children) &&
        !containsPaytmPanel(children)
      ) {
        return original(
          type,
          { ...(props || {}), children: appendPanel(children, baseCreateElement) },
          ...rest
        );
      }
      return original(type, props, ...rest);
    };
  }
}

function installPaytmPaymentEnhancement() {
  if (installed) return;
  installed = true;
  const baseCreateElement = React.createElement.bind(React);

  React.createElement = function paytmAwareCreateElement(type, props, ...children) {
    if (
      !injecting &&
      isCardType(type) &&
      isPaymentCard(children) &&
      !containsPaytmPanel(children)
    ) {
      return baseCreateElement(type, props, ...appendPanel(children, baseCreateElement));
    }
    return baseCreateElement(type, props, ...children);
  };

  patchAutomaticRuntime(automaticJsxRuntime, baseCreateElement);
  patchAutomaticRuntime(automaticJsxDevRuntime, baseCreateElement);
}

module.exports = {
  installPaytmPaymentEnhancement,
};
