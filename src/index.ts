import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ImageProps,
  ImageRequireSource,
  Platform,
  StyleSheet,
  ViewProps,
  ViewStyle,
  useColorScheme,
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
  pause?: boolean;

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
    pause = false,

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

  const colorScheme = useColorScheme();

  const backgroundColor: string =
    colorScheme === "dark" && manifest.darkBackground != null
      ? manifest.darkBackground
      : manifest.background;

  const logoFinalSrc: ImageRequireSource | undefined = skipLogo
    ? undefined
    : colorScheme === "dark" && darkLogoSrc != null
      ? darkLogoSrc
      : logoSrc;

  const brandFinalSrc: ImageRequireSource | undefined = skipBrand
    ? undefined
    : colorScheme === "dark" && darkBrandSrc != null
      ? darkBrandSrc
      : brandSrc;

  const ref = useRef({
    layoutReady: false,
    logoReady: skipLogo,
    brandReady: skipBrand,
    userReady: !pause,

    animate,
    animateHasBeenCalled: false,
  });

  const maybeRunAnimate = useCallback(() => {
    if (
      ref.current.layoutReady &&
      ref.current.logoReady &&
      ref.current.brandReady &&
      ref.current.userReady &&
      !ref.current.animateHasBeenCalled
    ) {
      ref.current.animateHasBeenCalled = true;

      hide({ fade: false })
        .then(() => ref.current.animate())
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    ref.current.animate = animate;
    ref.current.userReady = !pause;

    maybeRunAnimate();
  });

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
        ref.current.layoutReady = true;
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
              ref.current.logoReady = true;
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
              ref.current.brandReady = true;
              maybeRunAnimate();
            },
          };

    if (Platform.OS !== "android") {
      return { container, logo, brand };
    }

    const { logoSizeRatio, navigationBarHeight, statusBarHeight } =
      NativeModule.getConstants();

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
