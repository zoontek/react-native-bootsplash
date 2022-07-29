export type VisibilityStatus = "visible" | "hidden" | "transitioning";

export type Config = { fade?: boolean };

export type RNBootSplashType = {
  hide: (fade: boolean) => Promise<true>;
  getVisibilityStatus: () => Promise<VisibilityStatus>;
};
