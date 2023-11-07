import type { Spec } from "./NativeRNBootSplash";

function resolveAfter(delay: number) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

function removeNode(node: Node | null) {
  const parent = node?.parentNode;

  if (node != null && parent != null) {
    parent.removeChild(node);
  }
}

export default {
  getConstants: () => ({
    logoSizeRatio: 1,
    navigationBarHeight: 0,
    statusBarHeight: 0,
  }),

  hide: (fade) =>
    document.fonts.ready.then(() => {
      const container = document.getElementById("bootsplash");
      const style = document.getElementById("bootsplash-style");

      if (container == null || !fade) {
        removeNode(container);
        removeNode(style);
      } else {
        container.style.transitionProperty = "opacity";
        container.style.transitionDuration = "250ms";
        container.style.opacity = "0";

        return resolveAfter(250).then(() => {
          removeNode(container);
          removeNode(style);
        });
      }
    }),

  isVisible: () => {
    const container = document.getElementById("bootsplash");
    return Promise.resolve(container != null);
  },
} satisfies Spec;
