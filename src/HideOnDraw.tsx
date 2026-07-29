import { DrawMarker } from "./DrawMarker";

export type HideOnDrawProps = {
  fade?: boolean;
};

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
  return <DrawMarker fade={fade} />;
}
