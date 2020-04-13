declare module "react-native-bootsplash" {
  export type ShowConfig = {
    duration?: number;
  };
  export type HideConfig = {
    duration?: number;
  };

  export function show(config?: ShowConfig): void;
  export function hide(config?: HideConfig): void;

  const RNBootSplash: {
    show(config?: ShowConfig): void;
    hide(config?: HideConfig): void;
  };

  export default RNBootSplash;
}
