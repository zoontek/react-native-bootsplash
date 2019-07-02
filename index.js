import { NativeModules } from "react-native";
const { RNLaunchScreen } = NativeModules;

export default {
  hide(config = {}) {
    const merged = { duration: 0, ...config };
    RNLaunchScreen.hide(merged.duration);
  },
};
