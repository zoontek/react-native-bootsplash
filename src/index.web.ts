import type { Config, VisibilityStatus } from ".";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function hide(config: Config = {}): Promise<void> {
  const { fade } = { fade: false, ...config };
  const bootsplash = document.getElementById("bootsplash");

  if (!bootsplash) {
    console.warn("Bootsplash not found, have you set up your entrypoint?");
    return;
  }

  const visibilityStatus: VisibilityStatus =
    (bootsplash.getAttribute("data-visibility") as VisibilityStatus) ||
    "visible";

  if (visibilityStatus === "visible") {
    if (fade) {
      bootsplash.setAttribute("data-visibility", "transitioning");
      bootsplash.className = "fadeOut";
      await sleep(220);
      bootsplash.setAttribute("data-visibility", "hidden");
    } else {
      bootsplash.className = "hidden";
      bootsplash.setAttribute("data-visibility", "hidden");
    }
  }
}

export async function getVisibilityStatus(): Promise<VisibilityStatus> {
  const bootsplash = document.getElementById("bootsplash");

  if (!bootsplash) {
    // Incomplete setup, no bootsplash is showing.
    console.warn("Bootsplash not found, have you set up your entrypoint?");
    return "hidden";
  }

  const visibilityStatus = bootsplash.getAttribute(
    "data-visibility",
  ) as VisibilityStatus;

  if (!visibilityStatus) {
    // First Run
    return "visible";
  }

  return visibilityStatus;
}

export default {
  hide,
  getVisibilityStatus,
};
