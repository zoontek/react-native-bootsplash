import type { Spec } from "./NativeRNBootSplash";

// The SplashScreenManager native module of React Native for Vega (Amazon Fire TV)
export type VegaSplashScreenManager = {
  preventAutoHideV2: (rootTag: number) => void;
  hideV2: (rootTag: number) => void;
};

export type VegaSpecDependencies = {
  manager: VegaSplashScreenManager | null | undefined;
  // Calls the listener each time AppRegistry starts an app (before its first render)
  onAppStart: (listener: (rootTag: unknown, appKey?: string) => void) => void;
  colorScheme: () => string | null | undefined;
};

// Vega shows the splash screen from assets/raw/SplashScreenImages.zip and hides it on the first
// frame. preventAutoHideV2 keeps it until hideV2, both for the root tag of the app.
export const createVegaSpec = ({
  manager,
  onAppStart,
  colorScheme,
}: VegaSpecDependencies): Spec => {
  let state: "waiting" | "kept" | "hidden" =
    manager == null ? "hidden" : "waiting";
  let keptRootTag = 0;

  if (manager != null) {
    onAppStart((rootTag, appKey) => {
      if (
        state !== "waiting" ||
        typeof rootTag !== "number" ||
        appKey === "LogBox"
      ) {
        return;
      }

      try {
        manager.preventAutoHideV2(rootTag);
        keptRootTag = rootTag;
        state = "kept";
      } catch {
        state = "hidden"; // Vega hides the splash itself on the first frame
      }
    });
  }

  return {
    getConstants: () => ({
      darkModeEnabled: colorScheme() === "dark",
    }),

    // The Vega splash screen has no fade out
    hide: () => {
      if (manager == null || state !== "kept") {
        state = "hidden";
        return Promise.resolve();
      }

      state = "hidden";

      try {
        manager.hideV2(keptRootTag);
        return Promise.resolve();
      } catch (error) {
        return Promise.reject(error);
      }
    },

    isVisible: () => state !== "hidden",
  };
};
