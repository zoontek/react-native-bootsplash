import { StyleSheet } from "react-native";
import RNBootSplashDrawMarker from "./specs/RNBootSplashDrawMarkerNativeComponent";

export type HideOnDrawProps = {
  fade?: boolean;
};

const styles = StyleSheet.create({
  // The marker only needs to be drawn, not seen. Its size cannot be zero, as a
  // view with no area is never asked to draw itself
  marker: {
    height: 1,
    left: 0,
    position: "absolute",
    top: 0,
    width: 1,
  },
});

/**
 * Hides the splash screen from the native side, as soon as this marker has been
 * drawn. Mount it when your content is ready:
 *
 * ```tsx
 * <BootSplash.HideOnDraw fade />
 * // or, gated on your own readiness:
 * {isReady && <BootSplash.HideOnDraw fade />}
 * ```
 *
 * Unlike calling `hide()` from an effect or `onLayout`, the JS thread is not
 * involved in the dismissal itself, so a busy JS thread cannot delay it.
 */
export function HideOnDraw({ fade = false }: HideOnDrawProps) {
  return (
    <RNBootSplashDrawMarker
      fade={fade}
      pointerEvents="none"
      style={styles.marker}
    />
  );
}
