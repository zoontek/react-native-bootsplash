import type { TurboModule } from "react-native";
import { TurboModuleRegistry } from "react-native";

export interface Spec extends TurboModule {
  getConstants(): { navigationBarHeight: number; statusBarHeight: number };
  hide(fade: boolean): Promise<void>;
  isVisible(): Promise<boolean>;
}

export default TurboModuleRegistry.getEnforcing<Spec>("RNBootSplash");
