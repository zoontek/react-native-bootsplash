import { NativeModules, Platform } from "react-native";
const { RNBootSplash } = NativeModules;

export function hide(config = {}) {
  if (!NativeModules.RNBootSplash && Platform.OS === "web") {
    const duration = config.duration || 0;
    const element = document.getElementById("bootsplash");
    if (duration === 0) {
      element.style.display = "none";
      element.style.opacity = 0;
      return;
    }
    const listener = (event) => {
      if (event.target !== element) return;
      element.style.display = "none";
      element.removeEventListener("transitionend", listener);
    };
    element.addEventListener("transitionend", listener);
    element.style.transition = `opacity ${duration}ms ease-in-out`;
    element.style.opacity = 0;
    return;
  }
  RNBootSplash.hide({ duration: 0, ...config }.duration);
}

export function show(config = {}) {
  if (!NativeModules.RNBootSplash && Platform.OS === "web") {
    const duration = config.duration || 0;
    const element = document.getElementById("bootsplash");
    if (duration === 0) {
      element.style.display = "block";
      element.style.opacity = 1;
      return;
    }
    element.style.display = "block";
    element.offsetHeight;
    element.style.transition = `opacity ${duration}ms ease-in-out`;
    element.style.opacity = 1;
    return;
  }
  RNBootSplash.show({ duration: 0, ...config }.duration);
}

export default { show, hide };
