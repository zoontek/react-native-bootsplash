import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  createVegaSpec,
  type VegaSplashScreenManager,
} from "../src/specs/vegaSplash.ts";

type Call = [method: string, rootTag: number];

const setup = ({
  manager = "ok",
  colorScheme = "light",
}: {
  manager?: "ok" | "missing" | "preventThrows" | "hideThrows";
  colorScheme?: string | null;
} = {}) => {
  const calls: Call[] = [];
  let start: ((rootTag: unknown, appKey?: string) => void) | undefined;

  const native: VegaSplashScreenManager = {
    preventAutoHideV2: (rootTag) => {
      calls.push(["preventAutoHideV2", rootTag]);
      if (manager === "preventThrows") throw new Error("no splash");
    },
    hideV2: (rootTag) => {
      calls.push(["hideV2", rootTag]);
      if (manager === "hideThrows") throw new Error("hide failed");
    },
  };

  const spec = createVegaSpec({
    manager: manager === "missing" ? null : native,
    onAppStart: (listener) => {
      start = listener;
    },
    colorScheme: () => colorScheme,
  });

  return {
    spec,
    calls,
    startApp: (rootTag: unknown, appKey?: string) => start?.(rootTag, appKey),
    listening: () => start != null,
  };
};

describe("Vega spec", () => {
  test("keeps the splash when the app starts and hides it on hide()", async () => {
    const { spec, calls, startApp } = setup();

    assert.equal(spec.isVisible(), true);
    startApp(1);
    assert.deepEqual(calls, [["preventAutoHideV2", 1]]);
    assert.equal(spec.isVisible(), true);

    await spec.hide(false);
    assert.deepEqual(calls, [
      ["preventAutoHideV2", 1],
      ["hideV2", 1],
    ]);
    assert.equal(spec.isVisible(), false);
  });

  test("uses the root tag of the first start only (LogBox starts later)", async () => {
    const { spec, calls, startApp } = setup();

    startApp(11);
    startApp(21);
    await spec.hide(true);

    assert.deepEqual(calls, [
      ["preventAutoHideV2", 11],
      ["hideV2", 11],
    ]);
  });

  test("skips a LogBox start when React Native names the app", async () => {
    const { spec, calls, startApp } = setup();

    startApp(5, "LogBox");
    startApp(1, "MyApp");
    await spec.hide(false);

    assert.deepEqual(calls, [
      ["preventAutoHideV2", 1],
      ["hideV2", 1],
    ]);
  });

  test("waits for a start that has a root tag", async () => {
    const { spec, calls, startApp } = setup();

    startApp(undefined);
    startApp(1);
    await spec.hide(false);

    assert.deepEqual(calls, [
      ["preventAutoHideV2", 1],
      ["hideV2", 1],
    ]);
  });

  test("hides the splash once when hide() is called twice", async () => {
    const { spec, calls, startApp } = setup();

    startApp(1);
    await spec.hide(false);
    await spec.hide(false);

    assert.equal(calls.filter(([method]) => method === "hideV2").length, 1);
  });

  test("does not keep the splash when hide() comes before the app starts", async () => {
    const { spec, calls, startApp } = setup();

    await spec.hide(false);
    assert.equal(spec.isVisible(), false);

    startApp(1);
    assert.deepEqual(calls, []);
    assert.equal(spec.isVisible(), false);
  });

  test("lets Vega hide the splash itself when it cannot be kept", async () => {
    const { spec, calls, startApp } = setup({ manager: "preventThrows" });

    startApp(1);
    assert.equal(spec.isVisible(), false);

    await spec.hide(false);
    assert.deepEqual(calls, [["preventAutoHideV2", 1]]);
  });

  test("works without the native splash module", async () => {
    const { spec, listening } = setup({ manager: "missing" });

    assert.equal(listening(), false);
    assert.equal(spec.isVisible(), false);
    await spec.hide(false);
  });

  test("rejects hide() when Vega fails to hide the splash", async () => {
    const { spec, startApp } = setup({ manager: "hideThrows" });

    startApp(1);
    await assert.rejects(spec.hide(false), /hide failed/);
    assert.equal(spec.isVisible(), false);
  });

  test("reports dark mode from the color scheme", () => {
    assert.equal(
      setup({ colorScheme: "dark" }).spec.getConstants().darkModeEnabled,
      true,
    );
    assert.equal(
      setup({ colorScheme: "light" }).spec.getConstants().darkModeEnabled,
      false,
    );
    assert.equal(
      setup({ colorScheme: null }).spec.getConstants().darkModeEnabled,
      false,
    );
  });
});
