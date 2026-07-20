import { registerRootComponent } from "expo";

const { installAuthEnhancements } = require("./src/runtime/AuthEnhancements");
installAuthEnhancements();

const AppModule = require("./App");
const App = AppModule.default || AppModule;

registerRootComponent(App);
