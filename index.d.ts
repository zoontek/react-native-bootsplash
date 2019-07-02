declare module "react-native-launch-screen" {
  export type HideConfig = {
    duration?: number;
  };
  let RNLaunchScreen: {
    hide(config?: HideConfig): void;
  };
  export default RNLaunchScreen;
}
