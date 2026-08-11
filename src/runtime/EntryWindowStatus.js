function istClock(nowMs = Date.now()) {
  const now = new Date(nowMs + 330 * 60 * 1000);
  return {
    weekday: now.getUTCDay(),
    minute: now.getUTCHours() * 60 + now.getUTCMinutes(),
  };
}

function marketTimeReason(nowMs = Date.now()) {
  const { weekday, minute } = istClock(nowMs);
  if (weekday === 0 || weekday === 6) return "MARKET_CLOSED_WEEKEND";
  if (minute < 9 * 60 + 15) return "AUTO_ENTRY_BLOCKED_BEFORE_0915_IST";
  if (minute >= 15 * 60 + 30) return "MARKET_CLOSED_AFTER_1530_IST";
  if (minute >= 14 * 60 + 45) return "AUTO_ENTRY_CUTOFF_1445_IST";
  return "";
}

function marketTimeLabel(reason) {
  const value = String(reason || "").toUpperCase();
  if (value.includes("WEEKEND") || value.includes("MARKET_CLOSED")) {
    return "MARKET CLOSED";
  }
  if (value.includes("CUTOFF_1445")) return "ENTRY CUTOFF";
  if (value.includes("BEFORE_0915")) return "PRE-MARKET";
  return value ? "ENTRY BLOCKED" : "";
}

function executionBlockReason(signal, scan, nowMs = Date.now()) {
  return String(
    scan?.execution_block_reason ||
      scan?.signal_data?.execution_block_reason ||
      signal?.execution_block_reason ||
      marketTimeReason(nowMs) ||
      ""
  );
}

module.exports = {
  istClock,
  marketTimeReason,
  marketTimeLabel,
  executionBlockReason,
};
