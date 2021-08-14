import { RNBootSplash, VisibilityStatus } from "..";

type NMType = {
  RNBootSplash: RNBootSplash;
};

const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const NativeModules: NMType = {
  RNBootSplash: {
    async show(fade) {
      const bootsplash = document.getElementById("bootsplash");
      if (!bootsplash) {
        console.warn("Bootsplash not found, have you set up your entrypoint?");
        return true;
      }
      const visibilityStatus: VisibilityStatus =
        (bootsplash.getAttribute("data-visibility") as VisibilityStatus) ||
        "visible";

      if (visibilityStatus === "hidden") {
        if (fade) {
          bootsplash.setAttribute("data-visibility", "transitioning");
          bootsplash.className = "visibleFade";
          await sleep(600);
          bootsplash.setAttribute("data-visibility", "visible");
        } else {
          bootsplash.className = "visible";
          bootsplash.setAttribute("data-visibility", "visible");
        }
      }
      return true;
    },
    async hide(fade) {
      const bootsplash = document.getElementById("bootsplash");
      if (!bootsplash) {
        console.warn("Bootsplash not found, have you set up your entrypoint?");
        return true;
      }
      const visibilityStatus: VisibilityStatus =
        (bootsplash.getAttribute("data-visibility") as VisibilityStatus) ||
        "visible";

      if (visibilityStatus === "visible") {
        if (fade) {
          bootsplash.setAttribute("data-visibility", "transitioning");
          bootsplash.className = "hiddenFade";
          await sleep(600);
          bootsplash.setAttribute("data-visibility", "hidden");
        } else {
          bootsplash.className = "hidden";
          bootsplash.setAttribute("data-visibility", "hidden");
        }
      }
      return true;
    },
    async getVisibilityStatus() {
      const bootsplash = document.getElementById("bootsplash");
      if (!bootsplash) {
        console.warn("Bootsplash not found, have you set up your entrypoint?");
        // Incomplete setup, no bootsplash is showing.
        return "hidden";
      }
      const visibilityStatus = bootsplash.getAttribute("data-visibility");
      if (!visibilityStatus) {
        // First Run
        return "visible";
      }
      return visibilityStatus as VisibilityStatus;
    },
  },
};

export { NativeModules };
