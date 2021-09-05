import { NativeModules } from "react-native";

export type VisibilityStatus = "visible" | "hidden" | "transitioning";
export type Config = { fade?: boolean };

const NativeModule: {
  show: (fade: boolean) => Promise<true>;
  hide: (fade: boolean) => Promise<true>;
  getVisibilityStatus: () => Promise<VisibilityStatus>;
  statusBarHeight?: number;
  navigationBarHeight?: number;
} = NativeModules.RNBootSplash;

export function show(config: Config = {}): Promise<void> {
  return NativeModule.show({ fade: false, ...config }.fade).then(() => {});
}

export function hide(config: Config = {}): Promise<void> {
  return NativeModule.hide({ fade: false, ...config }.fade).then(() => {});
}

export function getVisibilityStatus(): Promise<VisibilityStatus> {
  return NativeModule.getVisibilityStatus();
}

export const statusBarHeight: number = NativeModule.statusBarHeight ?? 0;
export const navigationBarHeight: number =
  NativeModule.navigationBarHeight ?? 0;

export default {
  show,
  hide,
  getVisibilityStatus,
  statusBarHeight,
  navigationBarHeight,
};
