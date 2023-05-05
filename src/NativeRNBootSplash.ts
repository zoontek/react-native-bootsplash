import type { TurboModule } from "react-native";
import { TurboModuleRegistry } from "react-native";

export type VisibilityStatus = "visible" | "hidden" | "transitioning";

export interface Spec extends TurboModule {
  hide(duration: number): Promise<void>;
  getVisibilityStatus(): Promise<VisibilityStatus>;
}

export default TurboModuleRegistry.getEnforcing<Spec>("RNBootSplash");
