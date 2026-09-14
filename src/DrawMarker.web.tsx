import { useEffect } from "react";
import NativeModule from "./specs/NativeRNBootSplash";

export type DrawMarkerProps = {
  autoHide?: boolean;
  fade?: boolean;
  onDrawn?: () => void;
};

/**
 * Web counterpart of the native marker. There is no draw callback to hook into,
 * so the closest equivalent is an effect, which runs after the browser has
 * painted the commit that mounted this component.
 */
export function DrawMarker({
  autoHide = true,
  fade = false,
  onDrawn,
}: DrawMarkerProps) {
  useEffect(() => {
    if (autoHide) {
      NativeModule.hide(fade).catch(() => {});
    }

    onDrawn?.();
  }, [autoHide, fade, onDrawn]);

  return null;
}
