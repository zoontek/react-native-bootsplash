import type { ReactNode } from "react";
import {
  AppRegistry,
  Appearance,
  TurboModuleRegistry,
  type TurboModule,
} from "react-native";
import { createVegaSpec, type VegaSplashScreenManager } from "./vegaSplash";

const PassThrough = ({ children }: { children?: ReactNode }) => children;

export default createVegaSpec({
  manager: TurboModuleRegistry.get<TurboModule & VegaSplashScreenManager>(
    "SplashScreenManager",
  ),
  // The wrapper provider is the only place that receives the root tag before the first render
  onAppStart: (listener) => {
    AppRegistry.setWrapperComponentProvider((appParameters, appKey) => {
      listener((appParameters as { rootTag?: unknown }).rootTag, appKey);
      return PassThrough;
    });
  },
  colorScheme: () => Appearance.getColorScheme(),
});
