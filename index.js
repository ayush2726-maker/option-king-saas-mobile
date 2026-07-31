import './src/polyfills';
import { registerRootComponent } from 'expo';

// Install first so later Home/Trade wrappers pass their generated components
// through this layout layer. Only Trading Mode and AUTO Scan stay as Home
// dropdowns, bot controls move to the top, and live strategy score is collapsible.
const { installHomeLayoutRefinementEnhancement } = require(
  './src/runtime/HomeLayoutRefinementEnhancement'
);
installHomeLayoutRefinementEnhancement();

// Install before AppPatched loads LiveScoreTradeTabEnhancement. This lets the
// multi-trade wrapper replace the single Active Trade card and suppress the old
// global floating exit button.
const { installMultiOpenTradeEnhancement } = require(
  './src/runtime/MultiOpenTradeEnhancement'
);
installMultiOpenTradeEnhancement();

const AppModule = require('./AppTradeExplanationPatched');
const App = AppModule.default || AppModule;

registerRootComponent(App);
