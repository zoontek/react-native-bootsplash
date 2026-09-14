import { StyleSheet } from "react-native";
import RNBootSplashDrawMarker from "./specs/RNBootSplashDrawMarkerNativeComponent";

export type DrawMarkerProps = {
  autoHide?: boolean;
  fade?: boolean;
  onDrawn?: () => void;
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

export function DrawMarker({
  autoHide = true,
  fade = false,
  onDrawn,
}: DrawMarkerProps) {
  return (
    <RNBootSplashDrawMarker
      autoHide={autoHide}
      fade={fade}
      onDrawn={onDrawn}
      pointerEvents="none"
      style={styles.marker}
    />
  );
}
