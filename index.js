import './src/polyfills';
import { registerRootComponent } from 'expo';

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
