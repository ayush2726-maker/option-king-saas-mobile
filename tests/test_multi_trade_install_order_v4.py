from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_direct_multi_trade_hook_installs_before_app_module_load():
    source = (ROOT / "index.js").read_text(encoding="utf-8")

    install_call = source.index("installDirectActiveTradeCardV3();")
    app_load = source.index("require('./AppTradeExplanationPatched')")

    assert install_call < app_load, (
        "DirectActiveTradeCardV3 must patch jsx/jsxs before App.js is loaded; "
        "otherwise the legacy single-trade component captures the old runtime."
    )


def test_direct_panel_keeps_multi_open_and_trade_scoped_exit_contract():
    source = (
        ROOT / "src" / "runtime" / "DirectActiveTradeCardV3.js"
    ).read_text(encoding="utf-8")

    assert "normalizeOpenTrades(history, live, signal)" in source
    assert "trades.map((trade, index)" in source
    assert '"/bot/manual-exit"' in source
    assert "JSON.stringify({ trade_id: trade.id })" in source
    assert "EXIT THIS TRADE" in source


def test_legacy_floating_exit_remains_suppressed_after_app_load():
    source = (ROOT / "index.js").read_text(encoding="utf-8")

    app_load = source.index("require('./AppTradeExplanationPatched')")
    overlay_guard = source.index("installFinalMultiOpenTradeScreenV2();")

    assert app_load < overlay_guard
