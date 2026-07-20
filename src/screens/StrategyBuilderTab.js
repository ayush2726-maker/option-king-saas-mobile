const React = require("react");
const {
  useEffect,
  useMemo,
  useState,
} = React;

const {
  ActivityIndicator,
  Alert,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} = require("react-native");


const API =
  "https://option-king-saas-production.up.railway.app";

const C = {
  bg: "#0a0a0f",
  card: "#13131f",
  card2: "#1a1a2e",
  border: "#252540",
  text: "#e8e8f0",
  sub: "#a0a0c0",
  muted: "#606080",
  accent: "#7c6deb",
  green: "#00d4a0",
  red: "#ff4d6d",
  gold: "#f5c842",
  blue: "#4d9fff",
  orange: "#ff8c42",
};

const INDICATORS = [
  ["vwap", "VWAP Direction"],
  ["supertrend", "Supertrend"],
  ["ema_trend", "EMA9 / EMA21 Trend"],
  ["orb", "ORB Breakout"],
  ["momentum", "2-Candle Momentum"],
  ["adx", "ADX Strength"],
  ["volume", "Volume Confirmation"],
  ["mtf", "Trend / MTF Confirmation"],
];


async function request(
  path,
  token,
  options = {},
) {
  const response = await fetch(
    API + path,
    {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body:
        options.body == null
          ? undefined
          : JSON.stringify(options.body),
    },
  );

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data?.detail ||
      data?.message ||
      `HTTP ${response.status}`,
    );
  }

  return data;
}


function clone(value) {
  return JSON.parse(
    JSON.stringify(value || {}),
  );
}


function Card({
  children,
  style,
}) {
  return (
    <View
      style={[
        {
          backgroundColor: C.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: C.border,
          padding: 14,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}


function SmallButton({
  label,
  color = C.accent,
  onPress,
  disabled,
}) {
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={{
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 9,
        borderWidth: 1,
        borderColor:
          disabled
            ? C.border
            : color + "88",
        backgroundColor:
          disabled
            ? C.card2
            : color + "22",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <Text
        style={{
          color:
            disabled
              ? C.muted
              : color,
          fontSize: 11,
          fontWeight: "900",
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}


function NumericField({
  label,
  value,
  onChange,
  disabled,
  suffix,
}) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 130,
      }}
    >
      <Text
        style={{
          color: C.muted,
          fontSize: 10,
          fontWeight: "800",
          marginBottom: 5,
        }}
      >
        {label}
      </Text>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: C.border,
          borderRadius: 10,
          backgroundColor: C.card2,
          paddingHorizontal: 10,
        }}
      >
        <TextInput
          editable={!disabled}
          value={String(
            value ?? "",
          )}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          style={{
            flex: 1,
            color:
              disabled
                ? C.muted
                : C.text,
            fontSize: 13,
            paddingVertical: 10,
            fontWeight: "800",
          }}
        />

        {!!suffix && (
          <Text
            style={{
              color: C.muted,
              fontSize: 10,
              fontWeight: "800",
            }}
          >
            {suffix}
          </Text>
        )}
      </View>
    </View>
  );
}


function SectionTitle({
  title,
  subtitle,
}) {
  return (
    <View
      style={{
        marginBottom: 10,
      }}
    >
      <Text
        style={{
          color: C.text,
          fontSize: 15,
          fontWeight: "900",
        }}
      >
        {title}
      </Text>

      {!!subtitle && (
        <Text
          style={{
            color: C.muted,
            fontSize: 10,
            lineHeight: 15,
            marginTop: 3,
          }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}


function StrategyBuilderTab({
  token,
}) {
  const [profiles, setProfiles] =
    useState([]);
  const [selectedKey, setSelectedKey] =
    useState("");
  const [draft, setDraft] =
    useState(null);
  const [newName, setNewName] =
    useState("");
  const [loading, setLoading] =
    useState(false);
  const [message, setMessage] =
    useState("");
  const [error, setError] =
    useState("");

  const selected = useMemo(
    () => profiles.find(
      (profile) =>
        profile.profile_key
        === selectedKey,
    ) || null,
    [profiles, selectedKey],
  );

  const active = useMemo(
    () => profiles.find(
      (profile) => profile.active,
    ) || null,
    [profiles],
  );

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!selected) {
      setDraft(null);
      return;
    }

    setDraft({
      profile_key:
        selected.profile_key,
      name: selected.name,
      locked: selected.locked,
      active: selected.active,
      config: clone(
        selected.config,
      ),
    });
  }, [
    selected?.profile_key,
    selected?.updated_at,
    selected?.active,
  ]);

  async function load(
    preferredKey = "",
  ) {
    setLoading(true);
    setError("");

    try {
      const data = await request(
        "/strategy/profiles",
        token,
      );
      const nextProfiles =
        data?.profiles || [];

      setProfiles(nextProfiles);

      const desired =
        preferredKey ||
        (
          nextProfiles.some(
            (profile) =>
              profile.profile_key
              === selectedKey,
          )
            ? selectedKey
            : ""
        ) ||
        data?.active_profile
          ?.profile_key ||
        nextProfiles[0]
          ?.profile_key ||
        "";

      setSelectedKey(desired);
    } catch (err) {
      setError(
        err?.message ||
        "Strategy profiles load nahi hui.",
      );
    }

    setLoading(false);
  }

  function updateConfig(
    key,
    value,
  ) {
    setDraft((current) => ({
      ...current,
      config: {
        ...current.config,
        [key]: value,
      },
    }));
  }

  function updateEnabled(
    key,
    value,
  ) {
    setDraft((current) => ({
      ...current,
      config: {
        ...current.config,
        enabled: {
          ...current.config.enabled,
          [key]: value,
        },
      },
    }));
  }

  function updateWeight(
    key,
    value,
  ) {
    setDraft((current) => ({
      ...current,
      config: {
        ...current.config,
        weights: {
          ...current.config.weights,
          [key]: value,
        },
      },
    }));
  }

  function updateAnti(
    key,
    value,
  ) {
    setDraft((current) => ({
      ...current,
      config: {
        ...current.config,
        anti_chase: {
          ...current.config.anti_chase,
          [key]: value,
        },
      },
    }));
  }

  function preparedConfig() {
    const config = clone(
      draft?.config || {},
    );

    config.entry_threshold =
      Number(
        config.entry_threshold || 82,
      );
    config.adx_threshold =
      Number(
        config.adx_threshold || 25,
      );
    config.volume_threshold =
      Number(
        config.volume_threshold || 1.2,
      );

    config.weights =
      config.weights || {};

    INDICATORS.forEach(
      ([key]) => {
        config.weights[key] =
          Number(
            config.weights[key] || 0,
          );
      },
    );

    config.anti_chase =
      config.anti_chase || {};

    [
      "ema_min_points",
      "vwap_min_points",
      "ema_atr_multiplier",
      "vwap_atr_multiplier",
    ].forEach((key) => {
      config.anti_chase[key] =
        Number(
          config.anti_chase[key] || 0,
        );
    });

    return config;
  }

  async function createProfile() {
    const name =
      newName.trim() ||
      "My Custom Strategy";

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const data = await request(
        "/strategy/profiles",
        token,
        {
          method: "POST",
          body: {
            name,
            config: {},
          },
        },
      );

      setNewName("");
      setMessage(
        "✅ New strategy profile create ho gayi.",
      );
      await load(
        data?.profile?.profile_key,
      );
    } catch (err) {
      setError(
        err?.message ||
        "Profile create nahi hui.",
      );
    }

    setLoading(false);
  }

  async function saveProfile() {
    if (
      !draft ||
      draft.locked
    ) {
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const data = await request(
        `/strategy/profiles/${
          draft.profile_key
        }`,
        token,
        {
          method: "POST",
          body: {
            name:
              draft.name?.trim() ||
              "Custom Strategy",
            config:
              preparedConfig(),
          },
        },
      );

      setMessage(
        "✅ Strategy save ho gayi. Weights 100 me normalize ho gaye.",
      );
      await load(
        data?.profile?.profile_key,
      );
    } catch (err) {
      setError(
        err?.message ||
        "Strategy save nahi hui.",
      );
    }

    setLoading(false);
  }

  async function duplicateProfile() {
    if (!selected) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const data = await request(
        `/strategy/profiles/${
          selected.profile_key
        }/duplicate`,
        token,
        {
          method: "POST",
          body: {
            name:
              `${selected.name} Copy`,
          },
        },
      );

      setMessage(
        "✅ Strategy duplicate ho gayi.",
      );
      await load(
        data?.profile?.profile_key,
      );
    } catch (err) {
      setError(
        err?.message ||
        "Duplicate nahi hui.",
      );
    }

    setLoading(false);
  }

  async function activateProfile() {
    if (!selected) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await request(
        `/strategy/profiles/${
          selected.profile_key
        }/activate`,
        token,
        {
          method: "POST",
          body: {
            mode: "paper",
          },
        },
      );

      setMessage(
        "✅ Paper Mode ke liye strategy activate ho gayi. Next signal cycle se apply hogi.",
      );
      await load(
        selected.profile_key,
      );
    } catch (err) {
      setError(
        err?.message ||
        "Strategy activate nahi hui.",
      );
    }

    setLoading(false);
  }

  function confirmDelete() {
    if (
      !selected ||
      selected.locked
    ) {
      return;
    }

    Alert.alert(
      "Delete Strategy",
      `${selected.name} delete karna hai?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: deleteProfile,
        },
      ],
    );
  }

  async function deleteProfile() {
    if (!selected) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await request(
        `/strategy/profiles/${
          selected.profile_key
        }`,
        token,
        {
          method: "DELETE",
        },
      );

      setMessage(
        "✅ Strategy delete ho gayi.",
      );
      setSelectedKey("");
      await load();
    } catch (err) {
      setError(
        err?.message ||
        "Strategy delete nahi hui.",
      );
    }

    setLoading(false);
  }

  const rawWeightTotal =
    draft?.config?.weights
      ? INDICATORS.reduce(
          (total, [key]) => (
            total +
            (
              draft.config.enabled?.[key]
                ? Number(
                    draft.config.weights?.[key]
                    || 0,
                  )
                : 0
            )
          ),
          0,
        )
      : 0;

  const readOnly =
    !!draft?.locked;

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: C.bg,
      }}
      contentContainerStyle={{
        padding: 16,
        gap: 12,
        paddingBottom: 120,
      }}
    >
      <Card
        style={{
          borderColor:
            active
              ? C.green + "88"
              : C.border,
        }}
      >
        <Text
          style={{
            color: C.green,
            fontSize: 10,
            fontWeight: "900",
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          Active Paper Strategy
        </Text>

        <Text
          style={{
            color: C.text,
            fontSize: 20,
            fontWeight: "900",
            marginTop: 5,
          }}
        >
          {active?.name ||
            "OKAI Default 82"}
        </Text>

        <Text
          style={{
            color: C.muted,
            fontSize: 11,
            lineHeight: 17,
            marginTop: 5,
          }}
        >
          Custom strategy next signal cycle
          se apply hoti hai. Open trade ka
          existing ATR exit system change
          nahi hota.
        </Text>
      </Card>

      {!!error && (
        <Card
          style={{
            borderColor: C.red + "88",
          }}
        >
          <Text
            style={{
              color: C.red,
              fontWeight: "800",
              fontSize: 12,
            }}
          >
            {error}
          </Text>
        </Card>
      )}

      {!!message && (
        <Card
          style={{
            borderColor:
              C.green + "66",
          }}
        >
          <Text
            style={{
              color: C.green,
              fontWeight: "800",
              fontSize: 12,
              lineHeight: 18,
            }}
          >
            {message}
          </Text>
        </Card>
      )}

      <Card>
        <SectionTitle
          title="Create New Strategy"
          subtitle="New profile default scoring se start hogi; baad me weights edit karo."
        />

        <TextInput
          value={newName}
          onChangeText={setNewName}
          placeholder="My Trend Strategy"
          placeholderTextColor={C.muted}
          style={{
            backgroundColor: C.card2,
            borderColor: C.border,
            borderWidth: 1,
            borderRadius: 11,
            color: C.text,
            fontSize: 13,
            paddingHorizontal: 12,
            paddingVertical: 11,
            marginBottom: 10,
          }}
        />

        <SmallButton
          label="＋ Create Strategy"
          color={C.green}
          onPress={createProfile}
          disabled={loading}
        />
      </Card>

      <Card>
        <SectionTitle
          title="Strategy Profiles"
          subtitle="OKAI Default 82 locked hai. Custom profiles create, duplicate, edit aur activate kar sakte ho."
        />

        {loading &&
          profiles.length === 0 && (
            <ActivityIndicator
              color={C.accent}
            />
          )}

        {profiles.map((profile) => {
          const selectedNow =
            profile.profile_key
            === selectedKey;

          return (
            <TouchableOpacity
              key={profile.profile_key}
              onPress={() =>
                setSelectedKey(
                  profile.profile_key,
                )
              }
              style={{
                backgroundColor:
                  selectedNow
                    ? C.accent + "18"
                    : C.card2,
                borderRadius: 12,
                borderWidth: 1,
                borderColor:
                  profile.active
                    ? C.green
                    : selectedNow
                    ? C.accent
                    : C.border,
                padding: 11,
                marginBottom: 8,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent:
                    "space-between",
                  gap: 8,
                }}
              >
                <View
                  style={{
                    flex: 1,
                  }}
                >
                  <Text
                    style={{
                      color: C.text,
                      fontSize: 13,
                      fontWeight: "900",
                    }}
                  >
                    {profile.name}
                  </Text>

                  <Text
                    style={{
                      color: C.muted,
                      fontSize: 10,
                      marginTop: 3,
                    }}
                  >
                    Entry{" "}
                    {
                      profile.config
                        ?.entry_threshold
                    }
                    {" • "}
                    {profile.locked
                      ? "LOCKED DEFAULT"
                      : "CUSTOM V1"}
                  </Text>
                </View>

                <Text
                  style={{
                    color:
                      profile.active
                        ? C.green
                        : C.muted,
                    fontSize: 10,
                    fontWeight: "900",
                  }}
                >
                  {profile.active
                    ? "ACTIVE"
                    : "SELECT"}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 5,
          }}
        >
          <SmallButton
            label="Duplicate"
            color={C.blue}
            onPress={duplicateProfile}
            disabled={
              loading || !selected
            }
          />

          <SmallButton
            label={
              selected?.active
                ? "Active"
                : "Activate Paper"
            }
            color={C.green}
            onPress={activateProfile}
            disabled={
              loading ||
              !selected ||
              selected.active
            }
          />

          <SmallButton
            label="Delete"
            color={C.red}
            onPress={confirmDelete}
            disabled={
              loading ||
              !selected ||
              selected.locked ||
              selected.active
            }
          />
        </View>
      </Card>

      {!!draft && (
        <>
          <Card>
            <SectionTitle
              title={
                readOnly
                  ? "OKAI Default 82"
                  : "Edit Strategy"
              }
              subtitle={
                readOnly
                  ? "Protected default profile ko edit/delete nahi kiya ja sakta. Duplicate karke custom version banao."
                  : "Scoring changes actual Paper signal engine me apply hongi."
              }
            />

            <Text
              style={{
                color: C.muted,
                fontSize: 10,
                fontWeight: "800",
                marginBottom: 5,
              }}
            >
              Strategy Name
            </Text>

            <TextInput
              editable={!readOnly}
              value={draft.name}
              onChangeText={(value) =>
                setDraft((current) => ({
                  ...current,
                  name: value,
                }))
              }
              style={{
                backgroundColor: C.card2,
                borderColor: C.border,
                borderWidth: 1,
                borderRadius: 11,
                color:
                  readOnly
                    ? C.muted
                    : C.text,
                fontSize: 13,
                paddingHorizontal: 12,
                paddingVertical: 11,
                marginBottom: 12,
              }}
            />

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 9,
              }}
            >
              <NumericField
                label="Entry Score"
                value={
                  draft.config
                    ?.entry_threshold
                }
                onChange={(value) =>
                  updateConfig(
                    "entry_threshold",
                    value,
                  )
                }
                disabled={readOnly}
                suffix="/100"
              />

              <NumericField
                label="ADX Threshold"
                value={
                  draft.config
                    ?.adx_threshold
                }
                onChange={(value) =>
                  updateConfig(
                    "adx_threshold",
                    value,
                  )
                }
                disabled={readOnly}
              />

              <NumericField
                label="Volume Threshold"
                value={
                  draft.config
                    ?.volume_threshold
                }
                onChange={(value) =>
                  updateConfig(
                    "volume_threshold",
                    value,
                  )
                }
                disabled={readOnly}
                suffix="x"
              />
            </View>
          </Card>

          <Card>
            <SectionTitle
              title="Indicator Scoring"
              subtitle={`Enabled raw total ${rawWeightTotal}. Save par backend enabled weights ko automatically 100 me normalize karega.`}
            />

            {INDICATORS.map(
              ([key, label]) => {
                const enabled =
                  !!draft.config
                    ?.enabled?.[key];

                return (
                  <View
                    key={key}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 9,
                      borderBottomWidth: 1,
                      borderBottomColor:
                        C.border,
                      gap: 10,
                    }}
                  >
                    <Switch
                      disabled={readOnly}
                      value={enabled}
                      onValueChange={(value) =>
                        updateEnabled(
                          key,
                          value,
                        )
                      }
                      trackColor={{
                        false: C.border,
                        true:
                          C.green + "77",
                      }}
                      thumbColor={
                        enabled
                          ? C.green
                          : C.muted
                      }
                    />

                    <View
                      style={{
                        flex: 1,
                      }}
                    >
                      <Text
                        style={{
                          color:
                            enabled
                              ? C.text
                              : C.muted,
                          fontSize: 12,
                          fontWeight: "800",
                        }}
                      >
                        {label}
                      </Text>
                    </View>

                    <TextInput
                      editable={
                        !readOnly &&
                        enabled
                      }
                      value={String(
                        draft.config
                          ?.weights?.[key]
                        ?? 0,
                      )}
                      onChangeText={(value) =>
                        updateWeight(
                          key,
                          value,
                        )
                      }
                      keyboardType="numeric"
                      style={{
                        width: 62,
                        backgroundColor:
                          C.card2,
                        borderColor:
                          C.border,
                        borderWidth: 1,
                        borderRadius: 9,
                        color:
                          enabled
                            ? C.gold
                            : C.muted,
                        fontWeight: "900",
                        textAlign: "center",
                        paddingVertical: 8,
                      }}
                    />
                  </View>
                );
              },
            )}
          </Card>

          <Card>
            <SectionTitle
              title="Sideways Market"
              subtitle="CAP = score maximum 70, BLOCK = no entry, ALLOW = normal scoring."
            />

            <View
              style={{
                flexDirection: "row",
                gap: 8,
              }}
            >
              {[
                ["cap", "CAP 70"],
                ["block", "BLOCK"],
                ["allow", "ALLOW"],
              ].map(
                ([value, label]) => (
                  <TouchableOpacity
                    key={value}
                    disabled={readOnly}
                    onPress={() =>
                      updateConfig(
                        "sideways_mode",
                        value,
                      )
                    }
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor:
                        draft.config
                          ?.sideways_mode
                        === value
                          ? C.orange
                          : C.border,
                      backgroundColor:
                        draft.config
                          ?.sideways_mode
                        === value
                          ? C.orange + "22"
                          : C.card2,
                      opacity:
                        readOnly
                          ? 0.65
                          : 1,
                    }}
                  >
                    <Text
                      style={{
                        color:
                          draft.config
                            ?.sideways_mode
                          === value
                            ? C.orange
                            : C.muted,
                        fontSize: 10,
                        fontWeight: "900",
                        textAlign: "center",
                      }}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ),
              )}
            </View>
          </Card>

          <Card>
            <SectionTitle
              title="Anti-Chase Controls"
              subtitle="Price EMA/VWAP se bahut door ho to late entry block hoti hai."
            />

            {[
              [
                "ema_enabled",
                "EMA Anti-Chase",
              ],
              [
                "vwap_enabled",
                "VWAP Anti-Chase",
              ],
            ].map(
              ([key, label]) => (
                <View
                  key={key}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent:
                      "space-between",
                    paddingVertical: 8,
                    borderBottomWidth: 1,
                    borderBottomColor:
                      C.border,
                  }}
                >
                  <Text
                    style={{
                      color: C.text,
                      fontSize: 12,
                      fontWeight: "800",
                    }}
                  >
                    {label}
                  </Text>

                  <Switch
                    disabled={readOnly}
                    value={
                      !!draft.config
                        ?.anti_chase?.[key]
                    }
                    onValueChange={(value) =>
                      updateAnti(
                        key,
                        value,
                      )
                    }
                    trackColor={{
                      false: C.border,
                      true:
                        C.green + "77",
                    }}
                    thumbColor={
                      draft.config
                        ?.anti_chase?.[key]
                        ? C.green
                        : C.muted
                    }
                  />
                </View>
              ),
            )}

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 9,
                marginTop: 10,
              }}
            >
              <NumericField
                label="EMA Min Points"
                value={
                  draft.config
                    ?.anti_chase
                    ?.ema_min_points
                }
                onChange={(value) =>
                  updateAnti(
                    "ema_min_points",
                    value,
                  )
                }
                disabled={readOnly}
              />

              <NumericField
                label="EMA ATR Multiplier"
                value={
                  draft.config
                    ?.anti_chase
                    ?.ema_atr_multiplier
                }
                onChange={(value) =>
                  updateAnti(
                    "ema_atr_multiplier",
                    value,
                  )
                }
                disabled={readOnly}
                suffix="x"
              />

              <NumericField
                label="VWAP Min Points"
                value={
                  draft.config
                    ?.anti_chase
                    ?.vwap_min_points
                }
                onChange={(value) =>
                  updateAnti(
                    "vwap_min_points",
                    value,
                  )
                }
                disabled={readOnly}
              />

              <NumericField
                label="VWAP ATR Multiplier"
                value={
                  draft.config
                    ?.anti_chase
                    ?.vwap_atr_multiplier
                }
                onChange={(value) =>
                  updateAnti(
                    "vwap_atr_multiplier",
                    value,
                  )
                }
                disabled={readOnly}
                suffix="x"
              />
            </View>
          </Card>

          {!readOnly && (
            <SmallButton
              label={
                loading
                  ? "Saving..."
                  : "💾 Save Strategy"
              }
              color={C.green}
              onPress={saveProfile}
              disabled={loading}
            />
          )}

          <Card
            style={{
              borderColor:
                C.gold + "55",
            }}
          >
            <Text
              style={{
                color: C.gold,
                fontSize: 11,
                fontWeight: "900",
                lineHeight: 17,
              }}
            >
              V1 Safety: activation sirf Paper Mode
              ke liye hai. ATR SL, dynamic profit
              lock, strict 2-candle reversal aur
              5-second exit monitoring protected
              rahenge.
            </Text>
          </Card>
        </>
      )}
    </ScrollView>
  );
}


module.exports = StrategyBuilderTab;
