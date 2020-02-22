declare module "react-native-bootsplash" {
  export type ShowConfig = {
    duration?: number;
  };
  export type HideConfig = {
    duration?: number;
  };

  const RNBootSplash: {
    show(config?: ShowConfig): void;
    hide(config?: HideConfig): void;
  };
  export default RNBootSplash;
}
