import { NativeModules } from "react-native";
const { RNBootSplash } = NativeModules;

export function hide(config = {}) {
  RNBootSplash.hide({ duration: 0, ...config }.duration);
}

export function show(config = {}) {
  RNBootSplash.show({ duration: 0, ...config }.duration);
}

export default { show, hide };
