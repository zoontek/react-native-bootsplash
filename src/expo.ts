import * as Expo from "@expo/config-plugins";
import { assignColorValue } from "@expo/config-plugins/build/android/Colors";
import { addImports } from "@expo/config-plugins/build/android/codeMod";
import { mergeContents } from "@expo/config-plugins/build/utils/generateCode";
import path from "path";
import { dedent } from "ts-dedent";
import { Manifest } from ".";
import { cleanIOSAssets, getExpoConfig, hfs } from "./generate";

type Props = {
  assetsDir?: string;
  android?: {
    parentTheme?: "TransparentStatus" | "EdgeToEdge";
    darkContentBarsStyle?: boolean;
  };
};

const withExpoVersionCheck =
  (platform: "android" | "ios"): Expo.ConfigPlugin<Props> =>
  (config) =>
    Expo.withDangerousMod(config, [
      platform,
      (config) => {
        getExpoConfig(config.modRequest.projectRoot); // will exit process if expo < 51.0.20
        return config;
      },
    ]);

const withAndroidAssets: Expo.ConfigPlugin<Props> = (config, props) =>
  Expo.withDangerousMod(config, [
    "android",
    (config) => {
      const { assetsDir = "assets/bootsplash" } = props;
      const { projectRoot, platformProjectRoot } = config.modRequest;

      const srcDir = path.resolve(projectRoot, assetsDir, "android");

      const destDir = path.resolve(
        platformProjectRoot,
        "app",
        "src",
        "main",
        "res",
      );

      for (const drawableDir of hfs.readDir(srcDir)) {
        const srcDrawableDir = path.join(srcDir, drawableDir);
        const destDrawableDir = path.join(destDir, drawableDir);

        hfs.ensureDir(destDrawableDir);

        for (const file of hfs.readDir(srcDrawableDir)) {
          hfs.copy(
            path.join(srcDrawableDir, file),
            path.join(destDrawableDir, file),
          );
        }
      }

      return config;
    },
  ]);

const withAndroidManifest: Expo.ConfigPlugin<Props> = (config) =>
  Expo.withAndroidManifest(config, (config) => {
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

const withMainActivity: Expo.ConfigPlugin<Props> = (config) =>
  Expo.withMainActivity(config, (config) => {
    const { modResults } = config;
    const { language } = modResults;

    const withImports = addImports(
      modResults.contents.replace(
        /(\/\/ )?setTheme\(R\.style\.AppTheme\)/,
        "// setTheme(R.style.AppTheme)",
      ),
      ["android.os.Bundle", "com.zoontek.rnbootsplash.RNBootSplash"],
      language === "java",
    );

    // indented with 4 spaces
    const withInit = mergeContents({
      src: withImports,
      comment: "    //",
      tag: "bootsplash-init",
      offset: 0,
      anchor: /super\.onCreate\(null\)/,
      newSrc:
        "    RNBootSplash.init(this, R.style.BootTheme)" +
        (language === "java" ? ";" : ""),
    });

    return {
      ...config,
      modResults: {
        ...modResults,
        contents: withInit.contents,
      },
    };
  });

const withAndroidStyles: Expo.ConfigPlugin<Props> = (config, props) =>
  Expo.withAndroidStyles(config, async (config) => {
    const { assetsDir = "assets/bootsplash", android = {} } = props;
    const { parentTheme, darkContentBarsStyle } = android;

    const { modRequest, modResults } = config;
    const { resources } = modResults;
    const { style = [] } = resources;

    const manifest = (await hfs.json(
      path.resolve(modRequest.projectRoot, assetsDir, "manifest.json"),
    )) as Manifest;

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

    if (manifest.brand != null) {
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
          parent:
            parentTheme === "TransparentStatus"
              ? "Theme.BootSplash.TransparentStatus"
              : parentTheme === "EdgeToEdge"
                ? "Theme.BootSplash.EdgeToEdge"
                : "Theme.BootSplash",
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

const withAndroidColors: Expo.ConfigPlugin<Props> = (config, props) =>
  Expo.withAndroidColors(config, async (config) => {
    const { assetsDir = "assets/bootsplash" } = props;
    const { projectRoot } = config.modRequest;

    const manifest = (await hfs.json(
      path.resolve(projectRoot, assetsDir, "manifest.json"),
    )) as Manifest;

    config.modResults = assignColorValue(config.modResults, {
      name: "bootsplash_background",
      value: manifest.background,
    });

    return config;
  });

const withAndroidColorsNight: Expo.ConfigPlugin<Props> = (config, props) =>
  Expo.withAndroidColorsNight(config, async (config) => {
    const { assetsDir = "assets/bootsplash" } = props;
    const { projectRoot } = config.modRequest;

    const manifest = (await hfs.json(
      path.resolve(projectRoot, assetsDir, "manifest.json"),
    )) as Manifest;

    if (manifest.darkBackground != null) {
      config.modResults = assignColorValue(config.modResults, {
        name: "bootsplash_background",
        value: manifest.darkBackground,
      });
    }

    return config;
  });

const withIOSAssets: Expo.ConfigPlugin<Props> = (config, props) =>
  Expo.withDangerousMod(config, [
    "ios",
    (config) => {
      const { assetsDir = "assets/bootsplash" } = props;

      const {
        projectRoot,
        platformProjectRoot,
        projectName = "",
      } = config.modRequest;

      const srcDir = path.resolve(projectRoot, assetsDir, "ios");
      const destDir = path.resolve(platformProjectRoot, projectName);

      cleanIOSAssets(destDir);

      hfs.copy(
        path.join(srcDir, "BootSplash.storyboard"),
        path.join(destDir, "BootSplash.storyboard"),
      );

      for (const xcassetsDir of ["Colors.xcassets", "Images.xcassets"]) {
        const srcXcassetsDir = path.join(srcDir, xcassetsDir);
        const destXcassetsDir = path.join(destDir, xcassetsDir);

        hfs.ensureDir(destXcassetsDir);

        for (const file of hfs.readDir(srcXcassetsDir)) {
          hfs.copy(
            path.join(srcXcassetsDir, file),
            path.join(destXcassetsDir, file),
          );
        }
      }

      return config;
    },
  ]);

const withAppDelegate: Expo.ConfigPlugin<Props> = (config) =>
  Expo.withAppDelegate(config, (config) => {
    const { modResults } = config;
    const { language } = modResults;

    if (language !== "objc" && language !== "objcpp") {
      throw new Error(
        `Cannot modify the project AppDelegate as it's not in a supported language: ${language}`,
      );
    }

    const withHeader = mergeContents({
      src: modResults.contents,
      comment: "//",
      tag: "bootsplash-header",
      offset: 1,
      anchor: /#import "AppDelegate\.h"/,
      newSrc: '#import "RNBootSplash.h"',
    });

    const withRootView = mergeContents({
      src: withHeader.contents,
      comment: "//",
      tag: "bootsplash-init",
      offset: 0,
      anchor: /@end/,
      newSrc: dedent`
        - (void)customizeRootView:(RCTRootView *)rootView {
          [super customizeRootView:rootView];
          [RNBootSplash initWithStoryboard:@"BootSplash" rootView:rootView];
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

const withInfoPlist: Expo.ConfigPlugin<Props> = (config) =>
  Expo.withInfoPlist(config, (config) => {
    config.modResults["UILaunchStoryboardName"] = "BootSplash";
    return config;
  });

const withXcodeProject: Expo.ConfigPlugin<Props> = (config) =>
  Expo.withXcodeProject(config, (config) => {
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

const withoutExpoSplashScreen: Expo.ConfigPlugin<Props> =
  Expo.createRunOncePlugin((config) => config, "expo-splash-screen", "skip");

export const withBootSplash: Expo.ConfigPlugin<Props | undefined> = (
  config,
  props = {},
) => {
  const plugins: Expo.ConfigPlugin<Props>[] = [];
  const { platforms = [] } = config;

  plugins.push(withoutExpoSplashScreen);

  if (platforms.includes("android")) {
    plugins.push(
      withExpoVersionCheck("android"),
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
      withExpoVersionCheck("ios"),
      withIOSAssets,
      withAppDelegate,
      withInfoPlist,
      withXcodeProject,
    );
  }

  return Expo.withPlugins(
    config,
    plugins.map((plugin) => [plugin, props]),
  );
};
