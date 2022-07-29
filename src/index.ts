import { NativeModules } from "react-native";
import { Config, RNBootSplashType, VisibilityStatus } from "./type";

// @ts-ignore
const isTurboModuleEnabled = global.__turboModuleProxy != null;

const NativeModule: RNBootSplashType = isTurboModuleEnabled
  ? require("./NativeBootSplash").default
  : NativeModules.RNBootSplash;

export function hide(config: Config = {}): Promise<void> {
  return NativeModule.hide({ fade: false, ...config }.fade).then(() => {});
}

export function getVisibilityStatus(): Promise<VisibilityStatus> {
  return NativeModule.getVisibilityStatus();
}

export default {
  hide,
  getVisibilityStatus,
};

export * from "./type";
