import { useEffect } from "react";

export type DrawMarkerProps = {
  onDrawn: () => void;
};

/**
 * Web counterpart of the native marker. There is no draw callback to hook into,
 * so the closest equivalent is an effect, which runs after the browser has
 * painted the commit that mounted this component.
 */
export function DrawMarker({ onDrawn }: DrawMarkerProps) {
  useEffect(() => {
    onDrawn();
  }, [onDrawn]);

  return null;
}
