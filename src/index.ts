import { NativeModules } from "react-native";

export type VisibilityStatus = "visible" | "hidden" | "transitioning";
export type Config = { fade?: boolean, duration?: number };

const NativeModule: {
  hide: (fade: boolean, duration: number) => Promise<true>;
  getVisibilityStatus: () => Promise<VisibilityStatus>;
} = NativeModules.RNBootSplash;

const DEFAULT_DURATION = 220;

export function hide(config: Config = {}): Promise<void> {
  const { fade = false, duration = DEFAULT_DURATION } = config;
  return NativeModule.hide(fade, Math.max(duration, DEFAULT_DURATION)).then(() => {});
}

export function getVisibilityStatus(): Promise<VisibilityStatus> {
  return NativeModule.getVisibilityStatus();
}

export default {
  hide,
  getVisibilityStatus,
};
