import { TurboModule, TurboModuleRegistry } from "react-native";
// @ts-ignore

export interface Spec extends TurboModule {
  hide: (fade: boolean) => Promise<true>;
  getVisibilityStatus: () => Promise<"visible" | "hidden" | "transitioning">;
}

export default TurboModuleRegistry.getEnforcing<Spec>("RNBootSplash");
