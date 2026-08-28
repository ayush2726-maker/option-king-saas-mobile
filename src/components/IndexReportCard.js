import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SAAS_URL = "https://option-king-saas-production.up.railway.app";
const LANGUAGE_KEY = "okai_lang";

const COPY = {
  en: {
    title: "🏆 All-Time Index Report Card",
    subtitle: "Realized net P&L after brokerage and execution costs",
    refresh: "REFRESH",
    best: "BEST",
    noData: "NO DATA YET",
    closedComparison: "Comparison will be available after closed trades are recorded.",
    loadingComparison: "Comparison is loading...",
    bestPositive: "is currently the best-performing index",
    bestNegative: "currently has the lowest loss",
    total: "Total",
    trades: "trades",
    closed: "closed",
    net: "Net",
    confidence: "Confidence",
    metricTrades: "TRADES",
    metricClosed: "CLOSED",
    winRate: "WIN RATE",
    avgPnl: "AVG P&L",
    profit: "Profit",
    loss: "Loss",
    breakeven: "Breakeven",
    open: "Open",
    empty: "The report is not available yet. Please refresh.",
    bankNote: "New BANKNIFTY entries are OFF. Previously closed BANKNIFTY trades will remain visible for comparison.",
    reportLoadFailed: "Unable to load the report",
  },
  hi: {
    title: "🏆 अब तक का इंडेक्स रिपोर्ट कार्ड",
    subtitle: "ब्रोकरेज और एग्जीक्यूशन लागत के बाद वास्तविक नेट P&L",
    refresh: "रिफ्रेश",
    best: "सर्वश्रेष्ठ",
    noData: "अभी डेटा उपलब्ध नहीं",
    closedComparison: "क्लोज़्ड ट्रेड दर्ज होने के बाद तुलना दिखाई जाएगी।",
    loadingComparison: "तुलना लोड हो रही है...",
    bestPositive: "फिलहाल सबसे बेहतर प्रदर्शन करने वाला इंडेक्स है",
    bestNegative: "फिलहाल सबसे कम नुकसान वाला इंडेक्स है",
    total: "कुल",
    trades: "ट्रेड",
    closed: "क्लोज़्ड",
    net: "नेट",
    confidence: "विश्वसनीयता",
    metricTrades: "ट्रेड",
    metricClosed: "क्लोज़्ड",
    winRate: "विन रेट",
    avgPnl: "औसत P&L",
    profit: "प्रॉफिट",
    loss: "लॉस",
    breakeven: "ब्रेक-ईवन",
    open: "ओपन",
    empty: "रिपोर्ट अभी उपलब्ध नहीं है। कृपया रिफ्रेश करें।",
    bankNote: "BANKNIFTY की नई एंट्री बंद है। पहले से क्लोज़्ड BANKNIFTY ट्रेड तुलना में दिखाई देते रहेंगे।",
    reportLoadFailed: "रिपोर्ट लोड नहीं हो सकी",
  },
};

const COLORS = {
  card: "#13131f",
  surface: "#0f0f1a",
  border: "#252540",
  text: "#e8e8f0",
  muted: "#7f7f9f",
  blue: "#4d9fff",
  green: "#00d4a0",
  red: "#ff4d6d",
  gold: "#f5c842",
  orange: "#ff8c42",
};

function money(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "--";
  const prefix = number > 0 ? "+" : "";
  return `${prefix}₹${number.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function percent(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `${number.toFixed(1)}%` : "--";
}

function comparisonText(report, t) {
  if (!report?.best_index) return t.closedComparison;
  const best = (report.indices || []).find(
    (item) => item.instrument === report.best_index
  );
  if (!best) return t.loadingComparison;
  const label = Number(best.realized_pnl) >= 0 ? t.bestPositive : t.bestNegative;
  return `${best.instrument} ${label}: ${money(best.realized_pnl)} net P&L.`;
}

export default function IndexReportCard({ token }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [language, setLanguage] = useState("en");
  const t = COPY[language] || COPY.en;

  const syncLanguage = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
      setLanguage(saved === "hi" ? "hi" : "en");
    } catch {}
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      await syncLanguage();
      const response = await fetch(
        SAAS_URL + "/bot/index-report-card?mode=all",
        {
          headers: { Authorization: "Bearer " + token },
        }
      );
      const payload = await response.json();
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || payload?.detail || t.reportLoadFailed);
      }
      setReport(payload);
      setMessage("");
    } catch (error) {
      setMessage(String(error?.message || error || t.reportLoadFailed));
    } finally {
      setLoading(false);
    }
  }, [token, syncLanguage, t.reportLoadFailed]);

  useEffect(() => {
    syncLanguage();
    load();
    const timer = setInterval(() => {
      syncLanguage();
      load();
    }, 30000);
    return () => clearInterval(timer);
  }, [load, syncLanguage]);

  const rows = Array.isArray(report?.indices) ? report.indices : [];
  const bestIndex = report?.best_index || null;

  return (
    <View style={styles.card} __okaiIndexReportCardV1={true}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.subtitle}>{t.subtitle}</Text>
        </View>
        <TouchableOpacity
          onPress={load}
          disabled={loading}
          style={styles.refreshButton}
          activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.blue} />
          ) : (
            <Text style={styles.refreshText}>{t.refresh}</Text>
          )}
        </TouchableOpacity>
      </View>

      {!!report && (
        <View
          style={[
            styles.verdict,
            {
              borderColor:
                Number(report.total_realized_pnl) >= 0
                  ? COLORS.green + "88"
                  : COLORS.orange + "88",
            },
          ]}>
          <Text style={styles.verdictTitle}>
            {bestIndex ? `${t.best}: ${bestIndex}` : t.noData}
          </Text>
          <Text style={styles.verdictText}>{comparisonText(report, t)}</Text>
          <Text style={styles.verdictMeta}>
            {t.total} {report.total_trades || 0} {t.trades} •{" "}
            {report.closed_trades || 0} {t.closed} • {t.net}{" "}
            {money(report.total_realized_pnl)} • {t.confidence}{" "}
            {report.comparison_confidence || "--"}
          </Text>
        </View>
      )}

      {rows.map((item) => {
        const pnl = Number(item?.realized_pnl || 0);
        const isBest = item?.instrument === bestIndex;
        return (
          <View
            key={item.instrument}
            style={[
              styles.indexRow,
              {
                borderColor: isBest
                  ? COLORS.gold + "aa"
                  : pnl >= 0
                  ? COLORS.green + "55"
                  : COLORS.red + "55",
              },
            ]}>
            <View style={styles.indexTop}>
              <View style={styles.indexNameWrap}>
                <Text style={styles.indexName}>{item.instrument}</Text>
                {isBest && <Text style={styles.bestBadge}>{t.best}</Text>}
              </View>
              <Text
                style={[
                  styles.pnl,
                  { color: pnl >= 0 ? COLORS.green : COLORS.red },
                ]}>
                {money(pnl)}
              </Text>
            </View>

            <View style={styles.metrics}>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>{t.metricTrades}</Text>
                <Text style={styles.metricValue}>{item.total_trades || 0}</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>{t.metricClosed}</Text>
                <Text style={styles.metricValue}>{item.closed_trades || 0}</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>{t.winRate}</Text>
                <Text style={styles.metricValue}>{percent(item.win_rate)}</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>{t.avgPnl}</Text>
                <Text
                  style={[
                    styles.metricValue,
                    {
                      color:
                        Number(item.average_pnl || 0) >= 0
                          ? COLORS.green
                          : COLORS.red,
                    },
                  ]}>
                  {money(item.average_pnl)}
                </Text>
              </View>
            </View>

            <Text style={styles.breakdown}>
              {t.profit} {item.profit_trades || 0} • {t.loss}{" "}
              {item.loss_trades || 0} • {t.breakeven}{" "}
              {item.breakeven_trades || 0} • {t.open}{" "}
              {item.open_trades || 0}
            </Text>
          </View>
        );
      })}

      {!loading && rows.length === 0 && (
        <Text style={styles.empty}>{t.empty}</Text>
      )}
      {!!message && <Text style={styles.error}>{message}</Text>}

      <Text style={styles.note}>{t.bankNote}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 15,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerText: { flex: 1, paddingRight: 10 },
  title: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  subtitle: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },
  refreshButton: {
    minWidth: 68,
    minHeight: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.blue + "88",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  refreshText: { color: COLORS.blue, fontSize: 9, fontWeight: "900" },
  verdict: {
    backgroundColor: COLORS.surface,
    borderRadius: 13,
    borderWidth: 1,
    padding: 12,
    marginBottom: 11,
  },
  verdictTitle: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 4,
  },
  verdictText: { color: COLORS.text, fontSize: 13, fontWeight: "800" },
  verdictMeta: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 5,
  },
  indexRow: {
    backgroundColor: COLORS.surface,
    borderRadius: 13,
    borderWidth: 1,
    padding: 12,
    marginBottom: 9,
  },
  indexTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  indexNameWrap: { flexDirection: "row", alignItems: "center", gap: 7 },
  indexName: { color: COLORS.text, fontSize: 15, fontWeight: "900" },
  bestBadge: {
    color: "#151000",
    backgroundColor: COLORS.gold,
    borderRadius: 7,
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 2,
    fontSize: 8,
    fontWeight: "900",
  },
  pnl: { fontSize: 15, fontWeight: "900" },
  metrics: { flexDirection: "row", justifyContent: "space-between" },
  metric: { flex: 1, alignItems: "center" },
  metricLabel: { color: COLORS.muted, fontSize: 8, fontWeight: "800" },
  metricValue: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "900",
    marginTop: 4,
  },
  breakdown: {
    color: COLORS.muted,
    fontSize: 10,
    textAlign: "center",
    marginTop: 10,
  },
  empty: { color: COLORS.muted, fontSize: 12, paddingVertical: 12 },
  error: { color: COLORS.red, fontSize: 11, marginTop: 8 },
  note: {
    color: COLORS.orange,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },
});
