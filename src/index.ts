import {
  type ReactElement,
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type ImageRequireSource,
  type ImageResizeMode,
  type ImageSourcePropType,
  type ImageStyle,
  type ViewStyle,
  Platform,
} from "react-native";
import {
  controlEdgeToEdgeValues,
  isEdgeToEdge,
} from "react-native-is-edge-to-edge";
import { DrawMarker } from "./DrawMarker";
import NativeModule from "./specs/NativeRNBootSplash";

const EDGE_TO_EDGE = isEdgeToEdge();

export { DrawMarker };
export type { DrawMarkerProps } from "./DrawMarker";

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
  marker: ReactElement;
};

export function hide(config: Config = {}): Promise<void> {
  const { fade = false } = config;
  return NativeModule.hide(fade).then(() => {});
}

export function isVisible(): boolean {
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
    drawReady: false,
    logoReady: skipLogo,
    brandReady: skipBrand,
    userReady: ready,

    animate,
    animateHasBeenCalled: false,
  });

  const maybeRunAnimate = useCallback(() => {
    if (
      ref.current.drawReady &&
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

  const onDrawn = useCallback(() => {
    ref.current.drawReady = true;
    maybeRunAnimate();
  }, [maybeRunAnimate]);

  useEffect(() => {
    ref.current.animate = animate;
    ref.current.userReady = ready;

    maybeRunAnimate();
  });

  return useMemo<UseHideAnimation>(() => {
    const containerStyle: ViewStyle = {
      alignItems: "center",
      backgroundColor,
      justifyContent: "center",
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    };

    const container: ContainerProps = {
      style: containerStyle,
    };

    // The marker does not hide the splash screen itself here: the animation can
    // only start once the logo and brand images are loaded too
    const marker = createElement(DrawMarker, { autoHide: false, onDrawn });

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
      return { container, logo, brand, marker };
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
      marker,
    };
  }, [
    logoSizeRatio,
    navigationBarHeight,
    statusBarHeight,

    maybeRunAnimate,
    onDrawn,

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
  DrawMarker,
  hide,
  isVisible,
  useHideAnimation,
};
