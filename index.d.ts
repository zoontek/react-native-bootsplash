declare module "react-native-bootsplash" {
  export type HideConfig = {
    duration?: number;
  };
  let RNBootSplash: {
    hide(config?: HideConfig): void;
  };
  export default RNBootSplash;
}
