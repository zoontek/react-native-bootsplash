#!/usr/bin/env node

"use strict";

const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const jimp = require("jimp");
const { join, dirname, basename } = path;
const { readFileSync, writeFileSync } = fs;
const Xcode = require("@raydeck/xcode");
const Plist = require("plist");
const { sync } = require("glob");

let projectName;

const logoFileName = "bootsplash_logo";
const xcassetName = "BootSplashLogo";
const androidColorRegex = /<color name="bootsplash_background">#\w+<\/color>/g;

const ContentsJson = `{
  "images": [
    {
      "idiom": "universal",
      "filename": "${logoFileName}.png",
      "scale": "1x"
    },
    {
      "idiom": "universal",
      "filename": "${logoFileName}@2x.png",
      "scale": "2x"
    },
    {
      "idiom": "universal",
      "filename": "${logoFileName}@3x.png",
      "scale": "3x"
    }
  ],
  "info": {
    "version": 1,
    "author": "xcode"
  }
}
`;

const getStoryboard = ({
  height,
  width,
  r,
  g,
  b,
}) => `<?xml version="1.0" encoding="UTF-8"?>
<document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0" toolsVersion="15505" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none" useAutolayout="YES" launchScreen="YES" useTraitCollections="YES" useSafeAreas="YES" colorMatched="YES" initialViewController="Dtp-p8-LvN">
    <device id="retina6_1" orientation="portrait" appearance="light"/>
    <dependencies>
        <deployment identifier="iOS"/>
        <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="15509"/>
        <capability name="Safe area layout guides" minToolsVersion="9.0"/>
        <capability name="documents saved in the Xcode 8 format" minToolsVersion="8.0"/>
    </dependencies>
    <scenes>
        <!--View Controller-->
        <scene sceneID="Fnd-62-7zz">
            <objects>
                <viewController id="Dtp-p8-LvN" sceneMemberID="viewController">
                    <view key="view" autoresizesSubviews="NO" userInteractionEnabled="NO" contentMode="scaleToFill" id="guO-oA-Nhw">
                        <rect key="frame" x="0.0" y="0.0" width="414" height="896"/>
                        <autoresizingMask key="autoresizingMask"/>
                        <subviews>
                            <imageView autoresizesSubviews="NO" clipsSubviews="YES" userInteractionEnabled="NO" contentMode="scaleAspectFit" image="${xcassetName}" translatesAutoresizingMaskIntoConstraints="NO" id="3lX-Ut-9ad">
                                <rect key="frame" x="${(414 - width) / 2}" y="${
  (896 - height) / 2
}" width="${width}" height="${height}"/>
                                <accessibility key="accessibilityConfiguration">
                                    <accessibilityTraits key="traits" image="YES" notEnabled="YES"/>
                                </accessibility>
                            </imageView>
                        </subviews>
                        <color key="backgroundColor" red="${r}" green="${g}" blue="${b}" alpha="1" colorSpace="calibratedRGB"/>
                        <accessibility key="accessibilityConfiguration">
                            <accessibilityTraits key="traits" notEnabled="YES"/>
                        </accessibility>
                        <constraints>
                            <constraint firstItem="3lX-Ut-9ad" firstAttribute="centerX" secondItem="eg9-kz-Dhh" secondAttribute="centerX" id="Fh9-Fy-1nT"/>
                            <constraint firstItem="3lX-Ut-9ad" firstAttribute="centerY" secondItem="guO-oA-Nhw" secondAttribute="centerY" id="nvB-Ic-PnI"/>
                        </constraints>
                        <viewLayoutGuide key="safeArea" id="eg9-kz-Dhh"/>
                    </view>
                </viewController>
                <placeholder placeholderIdentifier="IBFirstResponder" id="Lvb-Jr-bCV" userLabel="First Responder" customClass="UIResponder" sceneMemberID="firstResponder"/>
            </objects>
            <point key="canvasLocation" x="0.0" y="0.0"/>
        </scene>
    </scenes>
    <resources>
        <image name="${xcassetName}" width="${width}" height="${height}"/>
    </resources>
</document>
`;

const drawableXml = `<?xml version="1.0" encoding="utf-8"?>

<layer-list xmlns:android="http://schemas.android.com/apk/res/android" android:opacity="opaque">
    <item android:drawable="@color/bootsplash_background" />

    <item>
        <bitmap android:src="@mipmap/${logoFileName}" android:gravity="center" />
    </item>
</layer-list>
`;

const log = (text, dim = false) => {
  console.log(dim ? chalk.dim(text) : text);
};

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
};

const isValidHexadecimal = (value) => /^#?([0-9A-F]{3}){1,2}$/i.test(value);

const toFullHexadecimal = (hex) => {
  const prefixed = hex[0] === "#" ? hex : `#${hex}`;
  const up = prefixed.toUpperCase();

  return up.length === 4
    ? "#" + up[1] + up[1] + up[2] + up[2] + up[3] + up[3]
    : up;
};

const hexadecimalToAppleColor = (hex) => ({
  r: (parseInt(hex[1] + hex[2], 16) / 255).toPrecision(15),
  g: (parseInt(hex[3] + hex[4], 16) / 255).toPrecision(15),
  b: (parseInt(hex[5] + hex[6], 16) / 255).toPrecision(15),
});
const getProjectName = (projectPath) => {
  try {
    const appJsonPath = path.join(projectPath, "app.json");
    const appJson = fs.readFileSync(appJsonPath, "utf-8");
    const { name } = JSON.parse(appJson);

    if (!name) {
      throw new Error("Invalid projectPath");
    }

    return name;
  } catch (e) {
    return false;
  }
};

async function generate({
  projectPath,
  assetsPath,
  iconPath,
  backgroundColor,
  iconWidth: w1,
  confirmation,
}) {
  if (!projectPath || !assetsPath || !iconPath || !w1 || !confirmation) {
    throw "Missing arguments";
  }
  if (!projectName) projectName = getProjectName(projectPath);
  if (!projectName) throw "No valid project at path " + projectPath;
  const image = await jimp.read(iconPath);
  const imageMap = [];

  const fullHexadecimal = toFullHexadecimal(backgroundColor);
  const appleColors = hexadecimalToAppleColor(fullHexadecimal);

  const h = (size) =>
    Math.ceil(size * (image.bitmap.height / image.bitmap.width));

  const w15 = w1 * 1.5;
  const w2 = w1 * 2;
  const w3 = w1 * 3;
  const w4 = w1 * 4;

  const androidResPath = path.join(
    projectPath,
    "android",
    "app",
    "src",
    "main",
    "res",
  );

  if (fs.existsSync(androidResPath)) {
    const fileName = `${logoFileName}.png`;

    imageMap.push(
      [path.join(androidResPath, "mipmap-mdpi", fileName), [w1, h(w1)]],
      [path.join(androidResPath, "mipmap-hdpi", fileName), [w15, h(w15)]],
      [path.join(androidResPath, "mipmap-xhdpi", fileName), [w2, h(w2)]],
      [path.join(androidResPath, "mipmap-xxhdpi", fileName), [w3, h(w3)]],
      [path.join(androidResPath, "mipmap-xxxhdpi", fileName), [w4, h(w4)]],
    );
  } else {
    log(`No ${androidResPath} directory found. Skipping android generation…`);
  }

  const iosProjectPath = path.join(projectPath, "ios", projectName);
  const iosImagesPath = path.join(iosProjectPath, "Images.xcassets");

  if (fs.existsSync(iosImagesPath)) {
    const iosImageSetPath = path.join(iosImagesPath, `${xcassetName}.imageset`);
    ensureDir(iosImageSetPath);

    fs.writeFileSync(
      path.join(iosImageSetPath, "Contents.json"),
      ContentsJson,
      "utf-8",
    );

    imageMap.push(
      [path.join(iosImageSetPath, `${logoFileName}.png`), [w1, h(w1)]],
      [path.join(iosImageSetPath, `${logoFileName}@2x.png`), [w2, h(w2)]],
      [path.join(iosImageSetPath, `${logoFileName}@3x.png`), [w3, h(w3)]],
    );
  } else {
    log(`No ${iosImagesPath} directory found. Skipping iOS generation…`);
  }

  imageMap.push(
    [path.join(assetsPath, logoFileName + ".png"), [w1, h(w1)]],
    [path.join(assetsPath, logoFileName + "@1,5x.png"), [w15, h(w15)]],
    [path.join(assetsPath, logoFileName + "@2x.png"), [w2, h(w2)]],
    [path.join(assetsPath, logoFileName + "@3x.png"), [w3, h(w3)]],
    [path.join(assetsPath, logoFileName + "@4x.png"), [w4, h(w4)]],
  );

  log("👍  Looking good! Generating files…");

  await Promise.all(
    imageMap.map(([path, [width, height]]) =>
      image
        .clone()
        .cover(width, height)
        .writeAsync(path)
        .then(() => {
          log(`✨  ${path} (${width}x${height})`, true);
        }),
    ),
  );

  if (fs.existsSync(iosProjectPath)) {
    const storyboard = path.join(iosProjectPath, `BootSplash.storyboard`);

    fs.writeFileSync(
      storyboard,
      getStoryboard({ height: h(w1), width: w1, ...appleColors }),
      "utf-8",
    );

    log(`✨  ${storyboard}`, true);
  }

  if (fs.existsSync(androidResPath)) {
    const drawableDir = path.join(androidResPath, "drawable");
    ensureDir(drawableDir);
    const drawable = path.join(drawableDir, "bootsplash.xml");
    fs.writeFileSync(drawable, drawableXml, "utf-8");

    log(`✨  ${drawable}`, true);

    const valuesDir = path.join(androidResPath, "values");
    ensureDir(valuesDir);
    const colors = path.join(valuesDir, "colors.xml");

    if (fs.existsSync(colors)) {
      const content = fs.readFileSync(colors, "utf-8");

      if (content.match(androidColorRegex)) {
        fs.writeFileSync(
          colors,
          content.replace(
            androidColorRegex,
            `<color name="bootsplash_background">${fullHexadecimal}</color>`,
          ),
          "utf-8",
        );
      } else {
        fs.writeFileSync(
          colors,
          content.replace(
            /<\/resources>/g,
            `    <color name="bootsplash_background">${fullHexadecimal}</color>\n</resources>`,
          ),
          "utf-8",
        );
      }

      log(`✏️   Editing ${colors}`, true);
    } else {
      fs.writeFileSync(
        colors,
        `<resources>\n    <color name="bootsplash_background">${fullHexadecimal}</color>\n</resources>\n`,
        "utf-8",
      );

      log(`✨  ${colors}`, true);
    }
  }

  log(
    `✅  Done! Thanks for using ${chalk.underline("react-native-bootsplash")}.`,
  );
  return projectPath;
}

const addToProject = (root = process.cwd()) => {
  //Look for pbxproject
  const iosPath = join(root, "ios");
  const bootSplashes = sync(join(iosPath, "**", "BootSplash.storyboard"));
  const bootSplashPath = bootSplashes[0];
  if (!bootSplashPath) {
    console.error(
      "Could not find BootSplash.storyboard - try running: yarn generate-bootsplash",
    );
    return;
  }
  const projectsPaths = sync(
    join(iosPath, "**", "*.xcodeproj", "*.pbxproj"),
  ).filter((path) => !path.includes("Pods"));
  projectsPaths.forEach((path) => {
    const project = Xcode.project(path);
    project.parse((err) => {
      const fp = project.getFirstProject();
      const dir = basename(dirname(bootSplashPath));
      const file = project.addResourceFile(
        join(dir, "BootSplash.storyboard"),
        null,
        fp,
      );
      if (!file) return;
      file.uuid = project.generateUuid();
      const nts = project.pbxNativeTargetSection();
      for (var key in nts) {
        if (key.endsWith("_comment")) continue;
        const target = project.pbxTargetByName(nts[key].name);
        file.target = key;
        project.addToPbxBuildFileSection(file); // PBXBuildFile
        project.addToPbxResourcesBuildPhase(file);
      }
      //Look for the storyboard
      const out = project.writeSync();
      writeFileSync(path, out);
    });
  });

  const plistPaths = sync(join(iosPath, "**", "Info.plist"));
  plistPaths.forEach((path) => {
    const xml = readFileSync(path, { encoding: "utf8" });
    const plist = Plist.parse(xml);
    plist.UILaunchStoryboardName = "BootSplash.storyboard";
    const out = Plist.build(plist);
    writeFileSync(path, out);
  });
};
module.exports = { generate, addToProject };
