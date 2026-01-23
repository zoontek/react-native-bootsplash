import * as Expo from "@expo/config-plugins";
import { assignColorValue } from "@expo/config-plugins/build/android/Colors";
import { addImports } from "@expo/config-plugins/build/android/codeMod";
import { mergeContents } from "@expo/config-plugins/build/utils/generateCode";
import childProcess from "child_process";
import path from "path";
import semver from "semver";
import { dedent } from "ts-dedent";
import util from "util";
import {
  type RawProps,
  hfs,
  log,
  packageName,
  requireAddon,
  setIsExpo,
  transformProps,
  writeAndroidAssets,
  writeGenericAssets,
  writeIOSAssets,
  writeWebAssets,
} from "./generate";

const promisifiedExec = util.promisify(childProcess.exec);

const exec = (cmd: string) =>
  promisifiedExec(cmd).then(({ stdout, stderr }) => stdout || stderr);

const withoutExpoSplashScreen: Expo.ConfigPlugin<RawProps> =
  Expo.createRunOncePlugin(
    (expoConfig) => expoConfig,
    "expo-splash-screen",
    "skip",
  );

const withAndroidAssets: Expo.ConfigPlugin<RawProps> = (expoConfig, rawProps) =>
  Expo.withDangerousMod(expoConfig, [
    "android",
    async (config) => {
      const { platformProjectRoot, projectRoot } = config.modRequest;
      const props = await transformProps(projectRoot, rawProps);
      const addon = requireAddon(props);

      const androidOutputPath = path.resolve(
        platformProjectRoot,
        "app",
        "src",
        "main",
        "res",
      );

      await writeAndroidAssets({ androidOutputPath, props });
      await addon?.writeAndroidAssets({ androidOutputPath, props });

      return config;
    },
  ]);

const withAndroidManifest: Expo.ConfigPlugin<RawProps> = (expoConfig) =>
  Expo.withAndroidManifest(expoConfig, (config) => {
    config.modResults.manifest.application?.forEach((application) => {
      if (application.$["android:name"] === ".MainApplication") {
        const { activity } = application;

        activity?.forEach((activity) => {
          if (activity.$["android:name"] === ".MainActivity") {
            activity.$["android:theme"] = "@style/BootTheme";
          }
        });
      }
    });

    return config;
  });

const withMainActivity: Expo.ConfigPlugin<RawProps> = (expoConfig) =>
  Expo.withMainActivity(expoConfig, (config) => {
    const { modResults } = config;

    const withImports = addImports(
      modResults.contents.replace(
        /(\/\/ )?setTheme\(R\.style\.AppTheme\)/,
        "// setTheme(R.style.AppTheme)",
      ),
      ["android.os.Bundle", "com.zoontek.rnbootsplash.RNBootSplash"],
      false,
    );

    // indented with 4 spaces
    const withInit = mergeContents({
      src: withImports,
      comment: "    //",
      tag: "bootsplash-init",
      offset: 0,
      anchor: /super\.onCreate\((null|savedInstanceState)\)/,
      newSrc: "    RNBootSplash.init(this, R.style.BootTheme)",
    });

    return {
      ...config,
      modResults: {
        ...modResults,
        contents: withInit.contents,
      },
    };
  });

const withAndroidStyles: Expo.ConfigPlugin<RawProps> = (expoConfig, rawProps) =>
  Expo.withAndroidStyles(expoConfig, async (config) => {
    const { projectRoot } = config.modRequest;
    const { android, brand } = await transformProps(projectRoot, rawProps);
    const { darkContentBarsStyle } = android;

    const { modResults } = config;
    const { resources } = modResults;
    const { style = [] } = resources;

    const item = [
      {
        $: { name: "postBootSplashTheme" },
        _: "@style/AppTheme",
      },
      {
        $: { name: "bootSplashBackground" },
        _: "@color/bootsplash_background",
      },
      {
        $: { name: "bootSplashLogo" },
        _: "@drawable/bootsplash_logo",
      },
    ];

    if (brand != null) {
      item.push({
        $: { name: "bootSplashBrand" },
        _: "@drawable/bootsplash_brand",
      });
    }
    if (darkContentBarsStyle != null) {
      item.push({
        $: { name: "darkContentBarsStyle" },
        _: String(darkContentBarsStyle),
      });
    }

    const withBootTheme = [
      ...style.filter(({ $ }) => $.name !== "BootTheme"),
      {
        $: {
          name: "BootTheme",
          parent: "Theme.BootSplash",
        },
        item,
      },
    ];

    return {
      ...config,
      modResults: {
        ...modResults,
        resources: {
          ...resources,
          style: withBootTheme,
        },
      },
    };
  });

const withAndroidColors: Expo.ConfigPlugin<RawProps> = (expoConfig, rawProps) =>
  Expo.withAndroidColors(expoConfig, async (config) => {
    const { projectRoot } = config.modRequest;
    const { background } = await transformProps(projectRoot, rawProps);

    config.modResults = assignColorValue(config.modResults, {
      name: "bootsplash_background",
      value: background.hex,
    });

    return config;
  });

const withAndroidColorsNight: Expo.ConfigPlugin<RawProps> = (
  expoConfig,
  rawProps,
) =>
  Expo.withAndroidColorsNight(expoConfig, async (config) => {
    const { projectRoot } = config.modRequest;
    const props = await transformProps(projectRoot, rawProps);
    const addon = requireAddon(props);

    return addon != null
      ? await addon.withAndroidColorsNight({ config, props })
      : config;
  });

const withIOSAssets: Expo.ConfigPlugin<RawProps> = (expoConfig, rawProps) =>
  Expo.withDangerousMod(expoConfig, [
    "ios",
    async (config) => {
      const {
        platformProjectRoot,
        projectName = "",
        projectRoot,
      } = config.modRequest;

      const props = await transformProps(projectRoot, rawProps);
      const addon = requireAddon(props);
      const iosOutputPath = path.resolve(platformProjectRoot, projectName);

      await writeIOSAssets({ iosOutputPath, props });
      await addon?.writeIOSAssets({ iosOutputPath, props });

      return config;
    },
  ]);

const withAppDelegate: Expo.ConfigPlugin<RawProps> = (expoConfig) =>
  Expo.withAppDelegate(expoConfig, (config) => {
    const { modResults } = config;
    const { language } = modResults;

    if (language !== "swift") {
      throw new Error(
        `Cannot modify the project AppDelegate as it's not in a supported language: ${language}`,
      );
    }

    const withHeader = mergeContents({
      src: modResults.contents,
      comment: "//",
      tag: "bootsplash-header",
      offset: 1,
      anchor: /import Expo/,
      newSrc: "import RNBootSplash",
    });

    const withRootView = mergeContents({
      src: withHeader.contents,
      comment: "//",
      tag: "bootsplash-init",
      offset: 1,
      anchor: /class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {/,
      newSrc: dedent`
        public override func customize(_ rootView: UIView) {
          super.customize(rootView)
          RNBootSplash.initWithStoryboard("BootSplash", rootView: rootView)
        }
      `,
    });

    return {
      ...config,
      modResults: {
        ...modResults,
        contents: withRootView.contents,
      },
    };
  });

const withInfoPlist: Expo.ConfigPlugin<RawProps> = (expoConfig) =>
  Expo.withInfoPlist(expoConfig, (config) => {
    config.modResults["UILaunchStoryboardName"] = "BootSplash";
    return config;
  });

const withXcodeProject: Expo.ConfigPlugin<RawProps> = (expoConfig) =>
  Expo.withXcodeProject(expoConfig, (config) => {
    const { projectName = "" } = config.modRequest;

    Expo.IOSConfig.XcodeUtils.addResourceFileToGroup({
      filepath: path.join(projectName, "BootSplash.storyboard"),
      groupName: projectName,
      project: config.modResults,
      isBuildFile: true,
    });

    Expo.IOSConfig.XcodeUtils.addResourceFileToGroup({
      filepath: path.join(projectName, "Colors.xcassets"),
      groupName: projectName,
      project: config.modResults,
      isBuildFile: true,
    });

    return config;
  });

const withWebAssets: Expo.ConfigPlugin<RawProps> = (expoConfig, rawProps) =>
  Expo.withDangerousMod(expoConfig, [
    expoConfig.platforms?.includes("ios") ? "ios" : "android",
    async (config) => {
      const { projectRoot } = config.modRequest;
      const props = await transformProps(projectRoot, rawProps);
      const addon = requireAddon(props);

      const fileName = "public/index.html";
      const htmlTemplatePath = path.resolve(projectRoot, fileName);

      if (!hfs.exists(htmlTemplatePath)) {
        await exec(`npx expo customize ${fileName}`);
      }

      await writeWebAssets({ htmlTemplatePath, props });
      await addon?.writeWebAssets({ htmlTemplatePath, props });

      return config;
    },
  ]);

const withGenericAssets: Expo.ConfigPlugin<RawProps> = (expoConfig, rawProps) =>
  Expo.withDangerousMod(expoConfig, [
    expoConfig.platforms?.includes("ios") ? "ios" : "android",
    async (config) => {
      const { projectRoot } = config.modRequest;
      const props = await transformProps(projectRoot, rawProps);
      const addon = requireAddon(props);

      await writeGenericAssets({ props });
      await addon?.writeGenericAssets({ props });

      return config;
    },
  ]);

export const withBootSplash = Expo.createRunOncePlugin<
  (Partial<RawProps> & { logo: string }) | undefined
>((expoConfig, baseProps) => {
  const { platforms = [], sdkVersion = "0.1.0" } = expoConfig;

  setIsExpo(true);

  if (semver.lt(sdkVersion, "54.0.0")) {
    log.error("Requires Expo 54.0.0 (or higher)");
    process.exit(1);
  }

  if (!baseProps?.logo) {
    log.error("Missing required parameter 'logo'");
    process.exit(1);
  }

  const rawProps: RawProps = {
    assetsOutput: "assets/bootsplash",
    background: "#fff",
    brandWidth: 80,
    logoWidth: 100,
    ...baseProps,
  };

  const plugins: Expo.ConfigPlugin<RawProps>[] = [
    withoutExpoSplashScreen,
    withGenericAssets,
  ];

  if (platforms.includes("android")) {
    plugins.push(
      withAndroidAssets,
      withAndroidManifest,
      withMainActivity,
      withAndroidStyles,
      withAndroidColors,
      withAndroidColorsNight,
    );
  }

  if (platforms.includes("ios")) {
    plugins.push(
      withIOSAssets,
      withAppDelegate,
      withInfoPlist,
      withXcodeProject,
    );
  }

  if (platforms.includes("web")) {
    plugins.push(withWebAssets);
  }

  return Expo.withPlugins(
    expoConfig,
    plugins.map((plugin) => [plugin, rawProps]),
  );
}, packageName);
