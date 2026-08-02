const React = require("react");
const {
  ActivityIndicator,
  AppState,
  Text,
  TouchableOpacity,
  View,
} = require("react-native");
const AsyncStorage = require("@react-native-async-storage/async-storage").default;

const API_URL = "https://option-king-saas-production.up.railway.app";
const INDEX_OPTIONS = ["NIFTY", "BANKNIFTY", "SENSEX"];
const POLL_MS = 30000;
const REQUEST_TIMEOUT_MS = 12000;

const C = {
  card: "#111724",
  panel: "#0c121d",
  border: "#25334a",
  text: "#f4f7fb",
  muted: "#8f9db1",
  green: "#00d4a0",
  red: "#ff5c75",
  gold: "#f5c842",
  blue: "#4d9fff",
  purple: "#9b87ff",
};

const ROTATION_LABELS = {
  BROAD_POSITIVE: "Broad Positive",
  POSITIVE_BIAS: "Positive Bias",
  MIXED: "Mixed Rotation",
  NEGATIVE_BIAS: "Negative Bias",
  BROAD_NEGATIVE: "Broad Negative",
};

function number(value, digits = 2) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(digits) : "—";
}

function signedPercent(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "—";
  return `${parsed > 0 ? "+" : ""}${parsed.toFixed(2)}%`;
}

function tone(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || Math.abs(parsed) < 0.02) return C.muted;
  return parsed > 0 ? C.green : C.red;
}

async function fetchWithTimeout(url, options) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error("Sector data request timed out")),
      REQUEST_TIMEOUT_MS
    );
  });
  try {
    return await Promise.race([fetch(url, options), timeout]);
  } finally {
    clearTimeout(timeoutId);
  }
}

function Pill({ label, active, color, onPress }) {
  return React.createElement(
    TouchableOpacity,
    {
      onPress,
      activeOpacity: 0.82,
      style: {
        flex: 1,
        minHeight: 36,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: active ? color : C.border,
        backgroundColor: active ? `${color}22` : C.panel,
        paddingHorizontal: 4,
      },
    },
    React.createElement(
      Text,
      {
        style: {
          color: active ? color : C.muted,
          fontSize: 11,
          fontWeight: "900",
        },
      },
      label
    )
  );
}

function Metric({ label, value, color }) {
  return React.createElement(
    View,
    {
      style: {
        flex: 1,
        minWidth: 72,
        borderRadius: 11,
        backgroundColor: C.panel,
        borderWidth: 1,
        borderColor: C.border,
        paddingVertical: 9,
        paddingHorizontal: 8,
      },
    },
    React.createElement(
      Text,
      { style: { color: C.muted, fontSize: 9, fontWeight: "800" } },
      label
    ),
    React.createElement(
      Text,
      {
        style: {
          color: color || C.text,
          fontSize: 15,
          fontWeight: "900",
          marginTop: 3,
        },
      },
      String(value)
    )
  );
}

function StockRow({ stock }) {
  const change = Number(stock?.change_percent);
  const color = tone(change);
  return React.createElement(
    View,
    {
      style: {
        minHeight: 42,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderTopWidth: 1,
        borderTopColor: "#1c283b",
        paddingVertical: 7,
      },
    },
    React.createElement(
      View,
      { style: { flex: 1, paddingRight: 8 } },
      React.createElement(
        Text,
        { style: { color: C.text, fontSize: 12, fontWeight: "900" } },
        stock?.symbol || "—"
      ),
      React.createElement(
        Text,
        { numberOfLines: 1, style: { color: C.muted, fontSize: 9, marginTop: 2 } },
        stock?.name || ""
      )
    ),
    React.createElement(
      View,
      { style: { alignItems: "flex-end" } },
      React.createElement(
        Text,
        { style: { color, fontSize: 12, fontWeight: "900" } },
        signedPercent(change)
      ),
      React.createElement(
        Text,
        { style: { color: C.muted, fontSize: 9, marginTop: 2 } },
        `LTP ${number(stock?.ltp)}`
      )
    )
  );
}

function LeaderStrip({ title, rows, positive }) {
  const visible = Array.isArray(rows) ? rows.slice(0, 3) : [];
  if (!visible.length) return null;
  const color = positive ? C.green : C.red;
  return React.createElement(
    View,
    { style: { flex: 1, minWidth: 135 } },
    React.createElement(
      Text,
      { style: { color: C.muted, fontSize: 9, fontWeight: "900", marginBottom: 5 } },
      title
    ),
    visible.map((stock) =>
      React.createElement(
        View,
        {
          key: `${title}-${stock.symbol}`,
          style: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 4,
          },
        },
        React.createElement(
          Text,
          { style: { color: C.text, fontSize: 10, fontWeight: "800" } },
          stock.symbol
        ),
        React.createElement(
          Text,
          { style: { color, fontSize: 10, fontWeight: "900" } },
          signedPercent(stock.change_percent)
        )
      )
    )
  );
}

function SectorRotationCard() {
  const [selected, setSelected] = React.useState("NIFTY");
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [open, setOpen] = React.useState(true);
  const [expandedSector, setExpandedSector] = React.useState("");
  const mountedRef = React.useRef(true);
  const activeRef = React.useRef(AppState.currentState === "active");
  const requestRef = React.useRef(0);

  const load = React.useCallback(async (indexName, quiet = false) => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    if (!quiet) setLoading(true);
    setError("");

    try {
      const token = await AsyncStorage.getItem("saas_token");
      if (!token) throw new Error("Login session nahi mili");

      const response = await fetchWithTimeout(
        `${API_URL}/market/sector-rotation?index=${encodeURIComponent(indexName)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Sector rotation data unavailable");
      }
      if (!mountedRef.current || requestId !== requestRef.current) return;
      setData(payload);
      setExpandedSector((current) => {
        const sectors = payload?.sectors || [];
        if (current && sectors.some((item) => item.sector === current)) return current;
        return sectors[0]?.sector || "";
      });
    } catch (loadError) {
      if (!mountedRef.current || requestId !== requestRef.current) return;
      setError(String(loadError?.message || loadError));
    } finally {
      if (mountedRef.current && requestId === requestRef.current) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    mountedRef.current = true;
    load(selected);
    return () => {
      mountedRef.current = false;
      requestRef.current += 1;
    };
  }, [load, selected]);

  React.useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      activeRef.current = state === "active";
      if (activeRef.current && open) load(selected, true);
    });
    return () => subscription.remove();
  }, [load, open, selected]);

  React.useEffect(() => {
    if (!open) return undefined;
    const timer = setInterval(() => {
      if (activeRef.current) load(selected, true);
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [load, open, selected]);

  const summary = data?.summary || {};
  const sectors = Array.isArray(data?.sectors) ? data.sectors : [];
  const average = Number(summary.average_change_percent);
  const rotationColor = tone(average);

  return React.createElement(
    View,
    {
      __okaiSectorRotationCard: true,
      style: {
        backgroundColor: C.card,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: open ? "#2d4664" : C.border,
        overflow: "hidden",
        marginBottom: 12,
      },
    },
    React.createElement(
      TouchableOpacity,
      {
        onPress: () => setOpen((value) => !value),
        activeOpacity: 0.82,
        accessibilityRole: "button",
        accessibilityState: { expanded: open },
        style: {
          minHeight: 66,
          paddingHorizontal: 14,
          paddingVertical: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
      },
      React.createElement(
        View,
        { style: { flex: 1, paddingRight: 10 } },
        React.createElement(
          Text,
          { style: { color: C.text, fontSize: 16, fontWeight: "900" } },
          "🔄 Sector Rotation"
        ),
        React.createElement(
          Text,
          { style: { color: rotationColor, fontSize: 10, fontWeight: "900", marginTop: 4 } },
          data
            ? `${selected} • ${ROTATION_LABELS[summary.rotation] || summary.rotation || "Live breadth"}`
            : `${selected} • Live sector breadth`
        )
      ),
      loading
        ? React.createElement(ActivityIndicator, { size: "small", color: C.blue })
        : React.createElement(
            Text,
            { style: { color: C.blue, fontSize: 19, fontWeight: "900" } },
            open ? "⌃" : "⌄"
          )
    ),
    open
      ? React.createElement(
          View,
          { style: { paddingHorizontal: 13, paddingBottom: 14 } },
          React.createElement(
            View,
            { style: { flexDirection: "row", gap: 7, marginBottom: 12 } },
            INDEX_OPTIONS.map((indexName) =>
              React.createElement(Pill, {
                key: indexName,
                label: indexName,
                active: selected === indexName,
                color: indexName === "NIFTY" ? C.blue : indexName === "BANKNIFTY" ? C.purple : C.gold,
                onPress: () => {
                  if (selected !== indexName) {
                    setData(null);
                    setExpandedSector("");
                    setSelected(indexName);
                  }
                },
              })
            )
          ),
          error
            ? React.createElement(
                View,
                {
                  style: {
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#75354a",
                    backgroundColor: "#2a1520",
                    padding: 11,
                    marginBottom: 10,
                  },
                },
                React.createElement(
                  Text,
                  { style: { color: C.red, fontSize: 11, lineHeight: 16 } },
                  error
                ),
                React.createElement(
                  TouchableOpacity,
                  { onPress: () => load(selected), style: { marginTop: 8 } },
                  React.createElement(
                    Text,
                    { style: { color: C.blue, fontSize: 11, fontWeight: "900" } },
                    "Retry Live Data"
                  )
                )
              )
            : null,
          data
            ? React.createElement(
                React.Fragment,
                null,
                React.createElement(
                  View,
                  { style: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 10 } },
                  React.createElement(Metric, {
                    label: "INDEX AVG",
                    value: signedPercent(summary.average_change_percent),
                    color: rotationColor,
                  }),
                  React.createElement(Metric, {
                    label: "ADV / DEC",
                    value: `${summary.advancers || 0} / ${summary.decliners || 0}`,
                    color: C.text,
                  }),
                  React.createElement(Metric, {
                    label: "BREADTH",
                    value: `${number(summary.breadth_percent, 1)}%`,
                    color: Number(summary.breadth_percent) >= 50 ? C.green : C.red,
                  }),
                  React.createElement(Metric, {
                    label: "COVERAGE",
                    value: `${summary.coverage || 0}/${summary.constituents || 0}`,
                    color: C.blue,
                  })
                ),
                React.createElement(
                  View,
                  {
                    style: {
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 8,
                      borderRadius: 12,
                      backgroundColor: C.panel,
                      borderWidth: 1,
                      borderColor: C.border,
                      padding: 10,
                      marginBottom: 11,
                    },
                  },
                  React.createElement(
                    View,
                    { style: { flex: 1, minWidth: 130 } },
                    React.createElement(Text, { style: { color: C.muted, fontSize: 9, fontWeight: "900" } }, "STRONGEST SECTOR"),
                    React.createElement(Text, { style: { color: C.green, fontSize: 12, fontWeight: "900", marginTop: 4 } }, summary.strongest_sector || "—")
                  ),
                  React.createElement(
                    View,
                    { style: { flex: 1, minWidth: 130 } },
                    React.createElement(Text, { style: { color: C.muted, fontSize: 9, fontWeight: "900" } }, "WEAKEST SECTOR"),
                    React.createElement(Text, { style: { color: C.red, fontSize: 12, fontWeight: "900", marginTop: 4 } }, summary.weakest_sector || "—")
                  )
                ),
                React.createElement(
                  View,
                  {
                    style: {
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 14,
                      borderBottomWidth: 1,
                      borderBottomColor: C.border,
                      paddingBottom: 9,
                      marginBottom: 8,
                    },
                  },
                  React.createElement(LeaderStrip, { title: "TOP PLUS", rows: data.top_gainers, positive: true }),
                  React.createElement(LeaderStrip, { title: "TOP MINUS", rows: data.top_losers, positive: false })
                ),
                sectors.map((sector) => {
                  const sectorOpen = expandedSector === sector.sector;
                  const sectorColor = tone(sector.average_change_percent);
                  return React.createElement(
                    View,
                    {
                      key: sector.sector,
                      style: {
                        borderBottomWidth: 1,
                        borderBottomColor: C.border,
                        paddingVertical: 3,
                      },
                    },
                    React.createElement(
                      TouchableOpacity,
                      {
                        onPress: () => setExpandedSector(sectorOpen ? "" : sector.sector),
                        activeOpacity: 0.82,
                        style: {
                          minHeight: 48,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        },
                      },
                      React.createElement(
                        View,
                        { style: { flex: 1, paddingRight: 8 } },
                        React.createElement(
                          Text,
                          { style: { color: C.text, fontSize: 12, fontWeight: "900" } },
                          sector.sector
                        ),
                        React.createElement(
                          Text,
                          { style: { color: C.muted, fontSize: 9, marginTop: 3 } },
                          `Plus ${sector.advancers || 0} • Minus ${sector.decliners || 0} • ${sector.stocks?.length || 0} shares`
                        )
                      ),
                      React.createElement(
                        View,
                        { style: { alignItems: "flex-end" } },
                        React.createElement(
                          Text,
                          { style: { color: sectorColor, fontSize: 13, fontWeight: "900" } },
                          signedPercent(sector.average_change_percent)
                        ),
                        React.createElement(
                          Text,
                          { style: { color: C.blue, fontSize: 13, fontWeight: "900", marginTop: 2 } },
                          sectorOpen ? "⌃" : "⌄"
                        )
                      )
                    ),
                    sectorOpen
                      ? React.createElement(
                          View,
                          { style: { paddingBottom: 7 } },
                          (sector.stocks || []).map((stock) =>
                            React.createElement(StockRow, { key: stock.symbol, stock })
                          )
                        )
                      : null
                  );
                }),
                React.createElement(
                  View,
                  {
                    style: {
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: 10,
                    },
                  },
                  React.createElement(
                    Text,
                    { style: { flex: 1, color: C.muted, fontSize: 9, lineHeight: 14, paddingRight: 8 } },
                    "Display-only market breadth. Trade entry, exit aur orders untouched."
                  ),
                  React.createElement(
                    TouchableOpacity,
                    { onPress: () => load(selected), disabled: loading },
                    React.createElement(
                      Text,
                      { style: { color: C.blue, fontSize: 10, fontWeight: "900" } },
                      "Refresh"
                    )
                  )
                )
              )
            : loading
              ? React.createElement(
                  View,
                  { style: { alignItems: "center", paddingVertical: 18 } },
                  React.createElement(ActivityIndicator, { color: C.blue }),
                  React.createElement(
                    Text,
                    { style: { color: C.muted, fontSize: 10, marginTop: 8 } },
                    "Live sectors aur shares load ho rahe hain…"
                  )
                )
              : null
        )
      : null
  );
}

SectorRotationCard.OKAI_SECTOR_ROTATION_MARKER = "OKAI_SECTOR_ROTATION_UI_V1";
module.exports = SectorRotationCard;
