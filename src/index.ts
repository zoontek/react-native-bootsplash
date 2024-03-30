import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ImageProps,
  ImageRequireSource,
  Platform,
  StyleSheet,
  ViewProps,
  ViewStyle,
} from "react-native";
import NativeModule from "./NativeRNBootSplash";

export type Config = {
  fade?: boolean;
};

export type Manifest = {
  background: string;
  darkBackground?: string;
  logo: {
    width: number;
    height: number;
  };
  brand?: {
    bottom: number;
    width: number;
    height: number;
  };
};

export type UseHideAnimationConfig = {
  manifest: Manifest;

  logo?: ImageRequireSource;
  darkLogo?: ImageRequireSource;
  brand?: ImageRequireSource;
  darkBrand?: ImageRequireSource;

  animate: () => void;

  statusBarTranslucent?: boolean;
  navigationBarTranslucent?: boolean;
};

export type UseHideAnimation = {
  container: ViewProps;
  logo: ImageProps;
  brand: ImageProps;
};

export function hide(config: Config = {}): Promise<void> {
  const { fade = false } = config;
  return NativeModule.hide(fade).then(() => {});
}

export function isVisible(): Promise<boolean> {
  return NativeModule.isVisible();
}

export function useHideAnimation(config: UseHideAnimationConfig) {
  const {
    manifest,

    logo: logoSrc,
    darkLogo: darkLogoSrc,
    brand: brandSrc,
    darkBrand: darkBrandSrc,

    animate,

    statusBarTranslucent = false,
    navigationBarTranslucent = false,
  } = config;

  const skipLogo = logoSrc == null;
  const skipBrand = manifest.brand == null || brandSrc == null;

  const logoWidth = manifest.logo.width;
  const logoHeight = manifest.logo.height;
  const brandBottom = manifest.brand?.bottom;
  const brandWidth = manifest.brand?.width;
  const brandHeight = manifest.brand?.height;

  const [
    {
      darkModeEnabled,
      logoSizeRatio = 1,
      navigationBarHeight = 0,
      statusBarHeight = 0,
    },
  ] = useState(() => NativeModule.getConstants());

  const backgroundColor: string =
    darkModeEnabled && manifest.darkBackground != null
      ? manifest.darkBackground
      : manifest.background;

  const logoFinalSrc: ImageRequireSource | undefined = skipLogo
    ? undefined
    : darkModeEnabled && darkLogoSrc != null
      ? darkLogoSrc
      : logoSrc;

  const brandFinalSrc: ImageRequireSource | undefined = skipBrand
    ? undefined
    : darkModeEnabled && darkBrandSrc != null
      ? darkBrandSrc
      : brandSrc;

  const animateFn = useRef(animate);
  const layoutReady = useRef(false);
  const logoReady = useRef(skipLogo);
  const brandReady = useRef(skipBrand);
  const animateHasBeenCalled = useRef(false);

  useEffect(() => {
    animateFn.current = animate;
  });

  const maybeRunAnimate = useCallback(() => {
    if (
      layoutReady.current &&
      logoReady.current &&
      brandReady.current &&
      !animateHasBeenCalled.current
    ) {
      animateHasBeenCalled.current = true;

      hide({ fade: false })
        .then(() => animateFn.current())
        .catch(() => {});
    }
  }, []);

  return useMemo<UseHideAnimation>(() => {
    const containerStyle: ViewStyle = {
      ...StyleSheet.absoluteFillObject,
      backgroundColor,
      alignItems: "center",
      justifyContent: "center",
    };

    const container: ViewProps = {
      style: containerStyle,
      onLayout: () => {
        layoutReady.current = true;
        maybeRunAnimate();
      },
    };

    const logo: ImageProps =
      logoFinalSrc == null
        ? { source: -1 }
        : {
            fadeDuration: 0,
            resizeMode: "contain",
            source: logoFinalSrc,
            style: {
              width: logoWidth,
              height: logoHeight,
            },
            onLoadEnd: () => {
              logoReady.current = true;
              maybeRunAnimate();
            },
          };

    const brand: ImageProps =
      brandFinalSrc == null
        ? { source: -1 }
        : {
            fadeDuration: 0,
            resizeMode: "contain",
            source: brandFinalSrc,
            style: {
              position: "absolute",
              bottom: Platform.OS === "web" ? 60 : brandBottom,
              width: brandWidth,
              height: brandHeight,
            },
            onLoadEnd: () => {
              brandReady.current = true;
              maybeRunAnimate();
            },
          };

    if (Platform.OS !== "android") {
      return { container, logo, brand };
    }

    return {
      container: {
        ...container,
        style: {
          ...containerStyle,
          marginTop: statusBarTranslucent ? undefined : -statusBarHeight,
          marginBottom: navigationBarTranslucent
            ? undefined
            : -navigationBarHeight,
        },
      },
      logo: {
        ...logo,
        style: {
          width: logoWidth * logoSizeRatio,
          height: logoHeight * logoSizeRatio,
        },
      },
      brand,
    };
  }, [
    logoSizeRatio,
    navigationBarHeight,
    statusBarHeight,

    maybeRunAnimate,

    logoWidth,
    logoHeight,
    brandBottom,
    brandWidth,
    brandHeight,

    backgroundColor,
    logoFinalSrc,
    brandFinalSrc,

    statusBarTranslucent,
    navigationBarTranslucent,
  ]);
}

export default {
  hide,
  isVisible,
  useHideAnimation,
};
