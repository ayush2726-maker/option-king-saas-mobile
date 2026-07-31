import './src/polyfills';
import { registerRootComponent } from 'expo';

// Install before AppPatched loads LiveScoreTradeTabEnhancement. This lets the
// multi-trade wrapper replace the single Active Trade card and suppress the old
// global floating exit button.
const { installMultiOpenTradeEnhancement } = require(
  './src/runtime/MultiOpenTradeEnhancement'
);
installMultiOpenTradeEnhancement();

// Requiring the app loads the real Home accordion runtime first. The dedicated
// live-score wrapper is intentionally installed afterwards so it wraps the
// actual Trade-tab component instead of an earlier placeholder.
const AppModule = require('./AppTradeExplanationPatched');
const App = AppModule.default || AppModule;

const { installHomeLayoutRefinementEnhancement } = require(
  './src/runtime/HomeLayoutRefinementEnhancement'
);
installHomeLayoutRefinementEnhancement();

registerRootComponent(App);
