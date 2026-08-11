from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_session_exit_watcher_uses_one_foreground_request():
    source = (
        ROOT / "src" / "components" / "SessionAwareManualExitOverlayV10.js"
    ).read_text(encoding="utf-8")

    assert "const SESSION_CHECK_MS = 5000;" in source
    assert 'apiGet("/bot/trade-live", token)' in source
    assert 'apiGet("/bot/signal", token)' not in source
    assert 'apiGet("/bot/trade-history", token)' not in source
    assert 'appStateRef.current !== "active"' in source
    assert "live.success === false" in source


def test_live_score_rows_and_header_use_decision_score():
    source = (
        ROOT / "src" / "runtime" / "LiveScoreTradeTabEnhancement.js"
    ).read_text(encoding="utf-8")

    assert "const SIGNAL_POLL_MS = 10000;" in source
    assert "const HISTORY_POLL_MS = 60000;" in source
    assert "scan?.decision_score ??" in source
    assert "score: item?.decision_score ?? item?.score" in source
    assert "setInterval(() => loadTrade(true), SIGNAL_POLL_MS)" in source
    assert "if (silent) {" in source
    assert "const TradeHistoryCard = React.memo" in source
    assert "OKAI-LIVE-SCORE-MULTI-TRADE-V8" in source
    assert "React.useMemo(" in source
    assert "mergeOpenPositionsV8(history, livePayload, signal, snapshot)" in source


def test_ota_multi_trade_patch_preserves_performance_guards():
    source = (
        ROOT / "scripts" / "patch_live_score_multi_trades_v8.py"
    ).read_text(encoding="utf-8")

    assert 'appStateRef.current !== "active"' in source
    assert "setInterval(() => loadTrade(true), SIGNAL_POLL_MS)" in source
    assert "Date.now() - historyLoadedAtRef.current >= HISTORY_POLL_MS" in source
    assert "React.createElement(TradeHistoryCard, { history })" in source
    assert "setInterval(() => loadTrade(true), 3000)" not in source


def test_cached_gets_have_timeout_and_signal_deduplication():
    source = (
        ROOT / "src" / "runtime" / "AppNetworkPerformanceEnhancement.js"
    ).read_text(encoding="utf-8")

    assert "const GET_TIMEOUT_MS = 8 * 1000;" in source
    assert 'return { name: "signal", ttl: 2000 };' in source
    assert "fetchAndReadWithTimeout" in source
    assert "Request timed out after" in source


def test_account_dashboard_does_not_replay_graph_every_signal_tick():
    source = (ROOT / "App.js").read_text(encoding="utf-8")

    assert "const lastHeavyRefreshRef = useRef(0);" in source
    assert "now - lastHeavyRefreshRef.current >= 60 * 1000" in source
    assert "const [hist, trades] = await Promise.all([" in source
    assert "if (!silent) {\n        const strat = await apiGet" in source
