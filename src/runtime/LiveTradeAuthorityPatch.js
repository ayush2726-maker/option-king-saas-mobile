let installed = false;

function stripTradeQuoteFields(value) {
  if (Array.isArray(value)) return value.map(stripTradeQuoteFields);
  if (!value || typeof value !== 'object') return value;

  const out = {};
  const looksLikeTrade = Boolean(
    value.symbol &&
    (value.id != null || value.entry_price != null || value.qty != null || value.quantity != null)
  );

  for (const [key, child] of Object.entries(value)) {
    if (
      looksLikeTrade &&
      [
        'live_price',
        'current_price',
        'last_ltp',
        'ltp',
        'pnl',
        'net_pnl',
        'unrealized_pnl',
        'gross_pnl',
        'total_charges',
        'estimated_exit_costs',
        'execution_cost',
        'execution_costs',
        'cost',
        'charges',
        'quote_updated_at',
        'quote_age_seconds',
        'quote_source',
        'quote_stale',
      ].includes(key)
    ) {
      continue;
    }
    out[key] = stripTradeQuoteFields(child);
  }
  return out;
}

function installLiveTradeAuthorityPatch() {
  if (installed || typeof global.fetch !== 'function') return;
  const originalFetch = global.fetch.bind(global);

  global.fetch = async function patchedFetch(input, init) {
    const response = await originalFetch(input, init);
    const url = typeof input === 'string' ? input : String(input?.url || '');

    // /bot/signal is strategy/scan state, not the price authority for an
    // already-open trade. App.js merges it after /bot/trade-live, so stale
    // quote fields from signal can overwrite the fresh gateway LTP/P&L.
    if (!url.includes('/bot/signal')) return response;

    const originalJson = response.json.bind(response);
    response.json = async () => stripTradeQuoteFields(await originalJson());
    return response;
  };

  installed = true;
}

module.exports = { installLiveTradeAuthorityPatch };
