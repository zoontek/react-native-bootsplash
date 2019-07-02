import { NativeModules } from "react-native";
const { RNBootSplash } = NativeModules;

export default {
  hide(config = {}) {
    const merged = { duration: 0, ...config };
    RNBootSplash.hide(merged.duration);
  },
};
