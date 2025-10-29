import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type ImageRequireSource,
  type ImageResizeMode,
  type ImageSourcePropType,
  type ImageStyle,
  type ViewStyle,
  Platform,
  StyleSheet,
} from "react-native";
import {
  controlEdgeToEdgeValues,
  isEdgeToEdge,
} from "react-native-is-edge-to-edge";
import NativeModule from "./NativeRNBootSplash";

const EDGE_TO_EDGE = isEdgeToEdge();

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
  ready?: boolean;

  logo?: ImageRequireSource;
  darkLogo?: ImageRequireSource;
  brand?: ImageRequireSource;
  darkBrand?: ImageRequireSource;

  animate: () => void;

  statusBarTranslucent?: boolean;
  navigationBarTranslucent?: boolean;
};

export type ContainerProps = {
  style: ViewStyle;
  onLayout: () => void;
};

export type LogoProps = {
  source: ImageSourcePropType;
  fadeDuration?: number;
  resizeMode?: ImageResizeMode;
  style?: ImageStyle;
  onLoadEnd?: () => void;
};

export type BrandProps = {
  source: ImageSourcePropType;
  fadeDuration?: number;
  resizeMode?: ImageResizeMode;
  style?: ImageStyle;
  onLoadEnd?: () => void;
};

export type UseHideAnimation = {
  container: ContainerProps;
  logo: LogoProps;
  brand: BrandProps;
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
    ready = true,

    logo: logoSrc,
    darkLogo: darkLogoSrc,
    brand: brandSrc,
    darkBrand: darkBrandSrc,

    animate,

    statusBarTranslucent,
    navigationBarTranslucent,
  } = config;

  // __DEV__ global is missing in react-native-web
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    controlEdgeToEdgeValues({ statusBarTranslucent, navigationBarTranslucent });
  }

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

  const ref = useRef({
    layoutReady: false,
    logoReady: skipLogo,
    brandReady: skipBrand,
    userReady: ready,

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
    ref.current.userReady = ready;

    maybeRunAnimate();
  });

  return useMemo<UseHideAnimation>(() => {
    const containerStyle: ViewStyle = {
      ...StyleSheet.absoluteFillObject,
      backgroundColor,
      alignItems: "center",
      justifyContent: "center",
    };

    const container: ContainerProps = {
      style: containerStyle,
      onLayout: () => {
        ref.current.layoutReady = true;
        maybeRunAnimate();
      },
    };

    const logo: LogoProps =
      logoFinalSrc == null
        ? { source: -1 }
        : {
            source: logoFinalSrc,
            fadeDuration: 0,
            resizeMode: "contain",
            style: {
              width: logoWidth,
              height: logoHeight,
            },
            onLoadEnd: () => {
              ref.current.logoReady = true;
              maybeRunAnimate();
            },
          };

    const brand: BrandProps =
      brandFinalSrc == null
        ? { source: -1 }
        : {
            source: brandFinalSrc,
            fadeDuration: 0,
            resizeMode: "contain",
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

    return {
      container: {
        ...container,
        style: {
          ...containerStyle,
          marginTop:
            EDGE_TO_EDGE || (statusBarTranslucent ?? false)
              ? undefined
              : -statusBarHeight,
          marginBottom:
            EDGE_TO_EDGE || (navigationBarTranslucent ?? false)
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
