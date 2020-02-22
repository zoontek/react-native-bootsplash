import { NativeModules } from "react-native";
const { RNBootSplash } = NativeModules;

export default {
  hide(config = {}) {
    RNBootSplash.hide({ duration: 0, ...config }.duration);
  },
  show(config = {}) {
    RNBootSplash.show({ duration: 0, ...config }.duration);
  },
};
