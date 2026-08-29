import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const SAAS_URL = "https://option-king-saas-production.up.railway.app";

const C = {
  bg: "#0a0a0f",
  card: "#13131f",
  card2: "#1a1a2e",
  border: "#252540",
  text: "#e8e8f0",
  muted: "#8585a8",
  green: "#00d4a0",
  red: "#ff4d6d",
  gold: "#f5c842",
  blue: "#4d9fff",
  purple: "#7c6deb",
};

async function requestJson(path, token, options = {}) {
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
  } catch {
    data = {};
  }

  if (!response.ok) {
    const detail =
      typeof data?.detail === "string"
        ? data.detail
        : data?.message || `Server error ${response.status}`;
    throw new Error(detail);
  }

  return data;
}

function Pill({ label, ok, warning = false }) {
  const color = ok ? C.green : warning ? C.gold : C.red;
  return (
    <View style={[styles.pill, { borderColor: color + "77", backgroundColor: color + "18" }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

function StatusRow({ label, value, valueColor }) {
  return (
    <View style={styles.statusRow}>
      <Text style={styles.statusLabel}>{label}</Text>
      <Text selectable style={[styles.statusValue, valueColor ? { color: valueColor } : null]}>
        {String(value ?? "--")}
      </Text>
    </View>
  );
}

function GuideBlock({ title, commands }) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.guideBlock}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((value) => !value)}
        style={styles.guideHeader}
      >
        <Text style={styles.guideTitle}>{title}</Text>
        <Text style={styles.chevron}>{open ? "⌃" : "⌄"}</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.codeBox}>
          {(commands || []).map((command, index) => (
            <Text selectable key={`${title}-${index}`} style={styles.codeText}>
              {command}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

export default function LocalGatewayScreen({ token, lang = "en" }) {
  const hi = lang === "hi";
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [pairing, setPairing] = useState(false);
  const [error, setError] = useState("");
  const [showRequirements, setShowRequirements] = useState(false);
  const [deviceName, setDeviceName] = useState("OKAI Gateway Device");
  const [expectedIp, setExpectedIp] = useState("");
  const [pairToken, setPairToken] = useState("");

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const response = await requestJson("/local-gateway/access", token);
      setData(response);

      const currentIp = response?.gateway?.expected_static_ip || "";
      if (currentIp && !expectedIp) {
        setExpectedIp(currentIp);
      }

      const currentDevice = response?.gateway?.device_name || "";
      if (currentDevice && deviceName === "OKAI Gateway Device") {
        setDeviceName(currentDevice);
      }
    } catch (exc) {
      setError(String(exc?.message || exc));
    } finally {
      setLoading(false);
    }
  }, [token, expectedIp, deviceName]);

  useEffect(() => {
    load();
  }, [load]);

  const access = data?.access || {};
  const gateway = data?.gateway || {};
  const setup = data?.setup || {};

  const ipMatch = Boolean(
    gateway?.expected_static_ip &&
      gateway?.observed_ip &&
      gateway.expected_static_ip === gateway.observed_ip
  );

  const accessText = useMemo(() => {
    if (access?.allowed) {
      return hi
        ? "यह अकाउंट अपना Local Static-IP Gateway इस्तेमाल कर सकता है।"
        : "This account can use its own Local Static-IP Gateway.";
    }

    return access?.message || access?.reason || (hi ? "अभी उपलब्ध नहीं" : "Not available yet");
  }, [access, hi]);

  async function pairNow() {
    const ip = String(expectedIp || "").trim();

    if (!ip) {
      Alert.alert(
        hi ? "Static IP चाहिए" : "Static IP required",
        hi ? "अपना public static IPv4 fill करें।" : "Fill your public static IPv4."
      );
      return;
    }

    setPairing(true);
    setError("");
    setPairToken("");

    try {
      const response = await requestJson("/local-gateway/pair", token, {
        method: "POST",
        body: JSON.stringify({
          device_name: String(deviceName || "OKAI Gateway Device").trim(),
          expected_static_ip: ip,
        }),
      });

      if (response?.gateway_token) {
        setPairToken(response.gateway_token);
        Alert.alert(
          hi ? "Gateway Paired" : "Gateway Paired",
          hi
            ? "Token सिर्फ एक बार दिखेगा। इसे gateway device setup में paste करें।"
            : "Token is shown only once. Paste it in the gateway device setup."
        );
      }

      await load();
    } catch (exc) {
      setError(String(exc?.message || exc));
    } finally {
      setPairing(false);
    }
  }

  async function disarmNow() {
    setActionLoading(true);
    setError("");

    try {
      await requestJson("/local-gateway/disarm", token, {
        method: "POST",
        body: JSON.stringify({}),
      });

      await load();

      Alert.alert(
        hi ? "Gateway Disarmed" : "Gateway Disarmed",
        hi
          ? "नई LIVE entries बंद कर दी गई हैं। खुली position की local monitoring जारी रहेगी।"
          : "New LIVE entries are blocked. Local monitoring of an open position continues."
      );
    } catch (exc) {
      setError(String(exc?.message || exc));
    } finally {
      setActionLoading(false);
    }
  }

  function confirmDisarm() {
    Alert.alert(
      hi ? "नई LIVE Entries बंद करें?" : "Block new LIVE entries?",
      hi
        ? "इससे नई entry बंद होगी। Existing open position local SL/trailing से monitor होती रहेगी।"
        : "This blocks new entries. Existing open position remains monitored by local SL/trailing.",
      [
        { text: hi ? "रद्द करें" : "Cancel", style: "cancel" },
        { text: hi ? "Disarm करें" : "Disarm", style: "destructive", onPress: disarmNow },
      ]
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <Text style={styles.heroIconText}>GW</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>Local Static-IP Gateway</Text>
          <Text style={styles.heroSubtitle}>
            {hi
              ? "Angel One LIVE orders आपके अपने static-IP phone/desktop से जाएंगे।"
              : "Angel One LIVE orders leave from your own static-IP phone or desktop."}
          </Text>
        </View>
      </View>

      {loading && !data ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={C.purple} size="large" />
          <Text style={styles.mutedText}>{hi ? "Status check हो रहा है…" : "Checking status…"}</Text>
        </View>
      ) : null}

      {!!error && (
        <View style={[styles.notice, { borderColor: C.red + "66", backgroundColor: C.red + "12" }]}>
          <Text style={[styles.noticeTitle, { color: C.red }]}>{hi ? "Error" : "Error"}</Text>
          <Text selectable style={styles.noticeText}>{error}</Text>
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{hi ? "Account Eligibility" : "Account Eligibility"}</Text>
          <Pill label={access?.allowed ? "ELIGIBLE" : "LOCKED"} ok={Boolean(access?.allowed)} />
        </View>

        <Text style={styles.bodyText}>{accessText}</Text>

        {!access?.allowed && (
          <Text style={styles.helpText}>
            {hi
              ? "Active subscription/trial और automated-order consent जरूरी है।"
              : "An active subscription/trial and automated-order consent are required."}
          </Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{hi ? "Gateway Pairing Form" : "Gateway Pairing Form"}</Text>

        <Text style={styles.helpText}>
          {hi
            ? "यहाँ सिर्फ device name और public static IP fill करें। Angel API key, MPIN और TOTP app में नहीं भरना है।"
            : "Fill only device name and public static IP here. Do not enter Angel API key, MPIN or TOTP in the app."}
        </Text>

        <Text style={styles.inputLabel}>{hi ? "Device Name" : "Device Name"}</Text>
        <TextInput
          style={styles.input}
          value={deviceName}
          onChangeText={setDeviceName}
          placeholder="OKAI Server Phone"
          placeholderTextColor={C.muted}
        />

        <Text style={styles.inputLabel}>{hi ? "Public Static IPv4" : "Public Static IPv4"}</Text>
        <TextInput
          style={styles.input}
          value={expectedIp}
          onChangeText={setExpectedIp}
          placeholder="182.70.xxx.xxx"
          placeholderTextColor={C.muted}
          keyboardType="numbers-and-punctuation"
          autoCapitalize="none"
        />

        <TouchableOpacity
          accessibilityRole="button"
          disabled={pairing}
          onPress={pairNow}
          style={[styles.primaryButton, pairing && { opacity: 0.5 }]}
        >
          {pairing ? (
            <ActivityIndicator color={C.green} />
          ) : (
            <Text style={styles.primaryButtonText}>{hi ? "Pair Gateway" : "Pair Gateway"}</Text>
          )}
        </TouchableOpacity>

        {!!pairToken && (
          <View style={styles.tokenBox}>
            <Text style={styles.sectionLabel}>
              {hi ? "Gateway Token — सिर्फ एक बार" : "Gateway Token — shown once"}
            </Text>
            <Text selectable style={styles.codeText}>{pairToken}</Text>
            <Text style={styles.safetyLine}>
              {hi
                ? "इस token को gateway device setup में paste करें। Token किसी को send/screenshot न करें।"
                : "Paste this token in the gateway device setup. Do not send or screenshot it."}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{hi ? "Gateway Status" : "Gateway Status"}</Text>

          <TouchableOpacity onPress={load} disabled={loading} style={styles.refreshButton}>
            {loading ? (
              <ActivityIndicator color={C.blue} size="small" />
            ) : (
              <Text style={styles.refreshText}>{hi ? "Refresh" : "Refresh"}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.pillRow}>
          <Pill label={gateway?.paired ? "PAIRED" : "NOT PAIRED"} ok={Boolean(gateway?.paired)} />
          <Pill label={gateway?.online ? "ONLINE" : "OFFLINE"} ok={Boolean(gateway?.online)} />
          <Pill
            label={gateway?.server_armed ? "LIVE ARMED" : "DISARMED"}
            ok={false}
            warning={!gateway?.server_armed}
          />
        </View>

        <StatusRow label="Device" value={gateway?.device_name} />
        <StatusRow label="Expected Static IPv4" value={gateway?.expected_static_ip} />
        <StatusRow label="Observed IPv4" value={gateway?.observed_ip} />
        <StatusRow
          label="Static IP Match"
          value={ipMatch ? "YES" : "NO / NOT SEEN"}
          valueColor={ipMatch ? C.green : C.gold}
        />
        <StatusRow label="Agent Version" value={gateway?.agent_version} />
        <StatusRow label="Last Seen" value={gateway?.last_seen_at} />
        <StatusRow label="Open Positions" value={(gateway?.open_positions || []).length} />

        <TouchableOpacity
          accessibilityRole="button"
          disabled={actionLoading || !gateway?.paired}
          onPress={confirmDisarm}
          style={[
            styles.disarmButton,
            (!gateway?.paired || actionLoading) && { opacity: 0.45 },
          ]}
        >
          {actionLoading ? (
            <ActivityIndicator color={C.red} />
          ) : (
            <Text style={styles.disarmText}>
              {hi ? "नई LIVE Entries Disarm करें" : "Disarm New LIVE Entries"}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.safetyLine}>
          {hi
            ? "App से LIVE arm नहीं होगा। Gateway device पर exact phrase “ARM LIVE RISK SIZING” लिखें।"
            : "The app cannot arm LIVE orders. On the gateway device, enter the exact phrase “ARM LIVE RISK SIZING”."}
        </Text>
      </View>

      <View style={styles.card}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{ expanded: showRequirements }}
          onPress={() => setShowRequirements((value) => !value)}
          style={styles.cardHeader}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{hi ? "Setup Guide" : "Setup Guide"}</Text>
            <Text style={styles.helpText}>
              {hi ? "Gateway phone/desktop setup commands" : "Gateway phone/desktop setup commands"}
            </Text>
          </View>

          <Text style={styles.chevron}>{showRequirements ? "⌃" : "⌄"}</Text>
        </TouchableOpacity>

        {showRequirements && (
          <View style={{ marginTop: 10 }}>
            <View style={[styles.notice, { borderColor: C.gold + "66", backgroundColor: C.gold + "10" }]}>
              <Text style={[styles.noticeTitle, { color: C.gold }]}>
                {hi ? "Credentials Safety" : "Credentials Safety"}
              </Text>
              <Text style={styles.noticeText}>
                {hi
                  ? "Angel API key, MPIN, TOTP secret और gateway token कभी chat/screenshot में न भेजें।"
                  : "Never send the Angel API key, MPIN, TOTP secret or gateway token in chat or screenshots."}
              </Text>
            </View>

            <Text style={styles.sectionLabel}>{hi ? "Requirements" : "Requirements"}</Text>
            {(setup?.requirements || []).map((item, index) => (
              <Text key={`req-${index}`} style={styles.bulletText}>• {item}</Text>
            ))}

            <GuideBlock title="Android / Termux" commands={setup?.termux_commands} />
            <GuideBlock title="Windows / Linux Desktop" commands={setup?.desktop_commands} />

            <Text style={styles.sectionLabel}>{hi ? "Live Safety" : "Live Safety"}</Text>
            {(setup?.live_safety || []).map((item, index) => (
              <Text key={`safe-${index}`} style={styles.bulletText}>• {item}</Text>
            ))}
          </View>
        )}
      </View>

      <View style={[styles.notice, { borderColor: C.blue + "55", backgroundColor: C.blue + "10" }]}>
        <Text style={[styles.noticeTitle, { color: C.blue }]}>
          {hi ? "Settings में रखा गया" : "Kept under Settings"}
        </Text>
        <Text style={styles.noticeText}>
          {hi
            ? "Gateway setup Account में नहीं रहेगा। यह Settings → Local Gateway & Static IP से खुलेगा।"
            : "Gateway setup will not stay in Account. It opens from Settings → Local Gateway & Static IP."}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 110, gap: 12 },

  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.purple + "66",
    borderRadius: 18,
    padding: 16,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.purple + "20",
    borderWidth: 1,
    borderColor: C.purple + "66",
  },
  heroIconText: { color: C.text, fontSize: 15, fontWeight: "900" },
  heroTitle: { color: C.text, fontSize: 19, fontWeight: "900" },
  heroSubtitle: { color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 4 },

  loadingBox: { alignItems: "center", paddingVertical: 34, gap: 12 },
  mutedText: { color: C.muted, fontSize: 12 },

  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 15,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  cardTitle: { color: C.text, fontSize: 16, fontWeight: "900" },
  bodyText: { color: C.text, fontSize: 12, lineHeight: 18, marginTop: 10 },
  helpText: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },

  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginVertical: 12 },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  pillText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.3 },

  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  statusLabel: { color: C.muted, fontSize: 11, flex: 1 },
  statusValue: { color: C.text, fontSize: 11, fontWeight: "800", flex: 1.3, textAlign: "right" },

  inputLabel: { color: C.muted, fontSize: 11, fontWeight: "900", marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: C.card2,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: C.text,
    fontSize: 13,
  },

  refreshButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: C.blue + "18",
  },
  refreshText: { color: C.blue, fontSize: 11, fontWeight: "900" },

  primaryButton: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: C.green + "77",
    backgroundColor: C.green + "15",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  primaryButtonText: { color: C.green, fontSize: 12, fontWeight: "900" },

  disarmButton: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: C.red + "77",
    backgroundColor: C.red + "15",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  disarmText: { color: C.red, fontSize: 12, fontWeight: "900" },
  safetyLine: { color: C.gold, fontSize: 10, lineHeight: 16, marginTop: 10 },

  tokenBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: C.gold + "66",
    backgroundColor: C.gold + "10",
    borderRadius: 12,
    padding: 12,
  },

  notice: { borderWidth: 1, borderRadius: 13, padding: 12 },
  noticeTitle: { fontSize: 12, fontWeight: "900", marginBottom: 5 },
  noticeText: { color: C.muted, fontSize: 11, lineHeight: 17 },

  sectionLabel: { color: C.text, fontSize: 12, fontWeight: "900", marginTop: 14, marginBottom: 7 },
  bulletText: { color: C.muted, fontSize: 11, lineHeight: 18, marginBottom: 3 },

  guideBlock: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    overflow: "hidden",
  },
  guideHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: C.card2,
  },
  guideTitle: { color: C.text, fontSize: 12, fontWeight: "900" },
  chevron: { color: C.purple, fontSize: 18, fontWeight: "900" },
  codeBox: { backgroundColor: "#080811", padding: 12, gap: 8 },
  codeText: { color: C.green, fontSize: 10, lineHeight: 16, fontFamily: "monospace" },
});
