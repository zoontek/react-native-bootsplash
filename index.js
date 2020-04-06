import { NativeModules } from "react-native";
const { RNBootSplash } = NativeModules;
const hide = (config = {}) => {
  RNBootSplash.hide({ duration: 0, ...config }.duration);
};
const show = (config = {}) => {
  RNBootSplash.show({ duration: 0, ...config }.duration);
};
export default {
  show,
  hide,
};
export { show, hide };
