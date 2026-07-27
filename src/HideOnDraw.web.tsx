import { useEffect } from "react";
import NativeModule from "./specs/NativeRNBootSplash";

export type HideOnDrawProps = {
  fade?: boolean;
};

/**
 * Web counterpart of the native marker. There is no draw callback to hook into,
 * so the closest equivalent is an effect, which runs after the browser has
 * painted the commit that mounted this component.
 */
export function HideOnDraw({ fade = false }: HideOnDrawProps) {
  useEffect(() => {
    NativeModule.hide(fade).catch(() => {});
  }, [fade]);

  return null;
}
