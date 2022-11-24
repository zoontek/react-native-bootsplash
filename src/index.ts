import { NativeModules } from "react-native";

export type VisibilityStatus = "visible" | "hidden" | "transitioning";
export type Config = { fade?: boolean, duration?: number };

const NativeModule: {
  hide: (fade: boolean, duration: number) => Promise<true>;
  getVisibilityStatus: () => Promise<VisibilityStatus>;
} = NativeModules.RNBootSplash;

export function hide(config: Config = {}): Promise<void> {
  return NativeModule.hide(
    { fade: false, ...config }.fade,
    { duration: 220, ...config }.duration,
  ).then(() => {});
}

export function getVisibilityStatus(): Promise<VisibilityStatus> {
  return NativeModule.getVisibilityStatus();
}

export default {
  hide,
  getVisibilityStatus,
};
