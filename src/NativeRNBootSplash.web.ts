import type { Spec } from "./NativeRNBootSplash";

function resolveAfter(delay: number) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

export default {
  getConstants: () => ({ navigationBarHeight: 0, statusBarHeight: 0 }),

  hide: (fade) =>
    document.fonts.ready.then(() => {
      const container = document.getElementById("bootsplash");
      const parentNode = container?.parentNode;

      if (container == null || parentNode == null) {
        return;
      }

      if (!fade) {
        parentNode.removeChild(container);
      } else {
        container.style.transitionProperty = "opacity";
        container.style.transitionDuration = "250ms";
        container.style.opacity = "0";

        return resolveAfter(250).then(() => {
          parentNode.removeChild(container);
        });
      }
    }),

  isVisible: () => {
    const container = document.getElementById("bootsplash");
    return Promise.resolve(container != null);
  },
} satisfies Spec;
