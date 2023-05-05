import NativeModule, { VisibilityStatus } from "./NativeRNBootSplash";

export type { VisibilityStatus } from "./NativeRNBootSplash";
export type Config = { fade?: boolean; duration?: number };

export function hide(config: Config = {}): Promise<void> {
  const { fade = false, duration = 0 } = config;
  return NativeModule.hide(fade ? Math.max(duration, 220) : 0).then(() => {});
}

export function getVisibilityStatus(): Promise<VisibilityStatus> {
  return NativeModule.getVisibilityStatus();
}

export default {
  hide,
  getVisibilityStatus,
};
