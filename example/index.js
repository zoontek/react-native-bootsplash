import { AppRegistry } from "react-native";
import { name as appName } from "./app.json";
import { App } from "./src/App";

AppRegistry.registerComponent(appName, () => App);

if (typeof document !== "undefined") {
  const rootTag = document.getElementById("root");
  AppRegistry.runApplication(appName, { rootTag });
}
