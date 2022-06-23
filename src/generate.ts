import fs from "fs-extra";
import Jimp from "jimp";
import path from "path";
import pc from "picocolors";

const logoFileName = "bootsplash_logo";
const xcassetName = "BootSplashLogo";
// https://github.com/androidx/androidx/blob/androidx-main/core/core-splashscreen/src/main/res/values/dimens.xml#L22
const splashScreenIconSizeNoBackground = 288;
const androidColorName = "bootsplash_background";
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
  backgroundColor: hex,
}: {
  height: number;
  width: number;
  backgroundColor: string;
}) => {
  const r = (parseInt(hex[1] + hex[2], 16) / 255).toPrecision(15);
  const g = (parseInt(hex[3] + hex[4], 16) / 255).toPrecision(15);
  const b = (parseInt(hex[5] + hex[6], 16) / 255).toPrecision(15);

  return `<?xml version="1.0" encoding="UTF-8"?>
<document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0" toolsVersion="17147" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none" useAutolayout="YES" launchScreen="YES" useTraitCollections="YES" useSafeAreas="YES" colorMatched="YES" initialViewController="01J-lp-oVM">
    <device id="retina4_7" orientation="portrait" appearance="light"/>
    <dependencies>
        <deployment identifier="iOS"/>
        <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="17120"/>
        <capability name="Safe area layout guides" minToolsVersion="9.0"/>
        <capability name="documents saved in the Xcode 8 format" minToolsVersion="8.0"/>
    </dependencies>
    <scenes>
        <!--View Controller-->
        <scene sceneID="EHf-IW-A2E">
            <objects>
                <viewController id="01J-lp-oVM" sceneMemberID="viewController">
                    <view key="view" autoresizesSubviews="NO" userInteractionEnabled="NO" contentMode="scaleToFill" id="Ze5-6b-2t3">
                        <rect key="frame" x="0.0" y="0.0" width="375" height="667"/>
                        <autoresizingMask key="autoresizingMask"/>
                        <subviews>
                            <imageView autoresizesSubviews="NO" clipsSubviews="YES" userInteractionEnabled="NO" contentMode="scaleAspectFit" image="BootSplashLogo" translatesAutoresizingMaskIntoConstraints="NO" id="3lX-Ut-9ad">
                                <rect key="frame" x="${(375 - width) / 2}" y="${
    (667 - height) / 2
  }" width="${width}" height="${height}"/>
                                <accessibility key="accessibilityConfiguration">
                                    <accessibilityTraits key="traits" image="YES" notEnabled="YES"/>
                                </accessibility>
                            </imageView>
                        </subviews>
                        <viewLayoutGuide key="safeArea" id="Bcu-3y-fUS"/>
                        <color key="backgroundColor" red="${r}" green="${g}" blue="${b}" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>
                        <accessibility key="accessibilityConfiguration">
                            <accessibilityTraits key="traits" notEnabled="YES"/>
                        </accessibility>
                        <constraints>
                            <constraint firstItem="3lX-Ut-9ad" firstAttribute="centerX" secondItem="Ze5-6b-2t3" secondAttribute="centerX" id="Fh9-Fy-1nT"/>
                            <constraint firstItem="3lX-Ut-9ad" firstAttribute="centerY" secondItem="Ze5-6b-2t3" secondAttribute="centerY" id="nvB-Ic-PnI"/>
                        </constraints>
                    </view>
                </viewController>
                <placeholder placeholderIdentifier="IBFirstResponder" id="iYj-Kq-Ea1" userLabel="First Responder" sceneMemberID="firstResponder"/>
            </objects>
            <point key="canvasLocation" x="0.0" y="0.0"/>
        </scene>
    </scenes>
    <resources>
        <image name="${xcassetName}" width="${width}" height="${height}"/>
    </resources>
</document>
`;
};

const log = (text: string, dim = false) => {
  console.log(dim ? pc.dim(text) : text);
};

const isValidHexadecimal = (value: string) =>
  /^#?([0-9A-F]{3}){1,2}$/i.test(value);

const toFullHexadecimal = (hex: string) => {
  const prefixed = hex[0] === "#" ? hex : `#${hex}`;
  const up = prefixed.toUpperCase();

  return up.length === 4
    ? "#" + up[1] + up[1] + up[2] + up[2] + up[3] + up[3]
    : up;
};

export const generate = async ({
  android,
  ios,

  workingPath,
  logoPath,
  backgroundColor,
  logoWidth,
  flavor,
  assetsPath,
}: {
  android: {
    sourceDir: string;
    appName: string;
  } | null;
  ios: {
    projectPath: string;
  } | null;

  workingPath: string;
  logoPath: string;
  assetsPath?: string;

  backgroundColor: string;
  flavor: string;
  logoWidth: number;
}) => {
  if (!isValidHexadecimal(backgroundColor)) {
    throw new Error(
      "--background-color value is not a valid hexadecimal color.",
    );
  }

  const image = await Jimp.read(logoPath);
  const backgroundColorHex = toFullHexadecimal(backgroundColor);

  const getHeight = (size: number) =>
    Math.ceil(size * (image.bitmap.height / image.bitmap.width));

  const logWrite = (
    emoji: string,
    filePath: string,
    dimensions?: { width: number; height: number },
  ) =>
    log(
      `${emoji}  ${path.relative(workingPath, filePath)}` +
        (dimensions != null
          ? ` (${dimensions.width}x${dimensions.height})`
          : ""),
    );

  if (assetsPath && fs.existsSync(assetsPath)) {
    log(`\n    ${pc.underline("Assets")}`);

    await Promise.all(
      [
        { ratio: 1, suffix: "" },
        { ratio: 1.5, suffix: "@1,5x" },
        { ratio: 2, suffix: "@2x" },
        { ratio: 3, suffix: "@3x" },
        { ratio: 4, suffix: "@4x" },
      ].map(({ ratio, suffix }) => {
        const fileName = `${logoFileName}${suffix}.png`;
        const filePath = path.resolve(assetsPath, fileName);
        const width = logoWidth * ratio;
        const height = getHeight(width);

        return image
          .clone()
          .resize(width, height)
          .quality(100)
          .writeAsync(filePath)
          .then(() => {
            logWrite("✨", filePath, { width, height });
          });
      }),
    );
  }

  if (android) {
    log(`\n    ${pc.underline("Android")}`);

    const appPath = android.appName
      ? path.resolve(android.sourceDir, android.appName)
      : path.resolve(android.sourceDir); // @react-native-community/cli 2.x & 3.x support

    const resPath = path.resolve(appPath, "src", flavor, "res");
    const valuesPath = path.resolve(resPath, "values");

    fs.ensureDirSync(valuesPath);

    const colorsXmlPath = path.resolve(valuesPath, "colors.xml");
    const colorsXmlEntry = `<color name="${androidColorName}">${backgroundColorHex}</color>`;

    if (fs.existsSync(colorsXmlPath)) {
      const colorsXml = fs.readFileSync(colorsXmlPath, "utf-8");

      if (colorsXml.match(androidColorRegex)) {
        fs.writeFileSync(
          colorsXmlPath,
          colorsXml.replace(androidColorRegex, colorsXmlEntry),
          "utf-8",
        );
      } else {
        fs.writeFileSync(
          colorsXmlPath,
          colorsXml.replace(
            /<\/resources>/g,
            `    ${colorsXmlEntry}\n</resources>`,
          ),
          "utf-8",
        );
      }

      logWrite("✏️ ", colorsXmlPath);
    } else {
      fs.writeFileSync(
        colorsXmlPath,
        `<resources>\n    ${colorsXmlEntry}\n</resources>\n`,
        "utf-8",
      );

      logWrite("✨", colorsXmlPath);
    }

    await Promise.all(
      [
        { ratio: 1, directory: "mipmap-mdpi" },
        { ratio: 1.5, directory: "mipmap-hdpi" },
        { ratio: 2, directory: "mipmap-xhdpi" },
        { ratio: 3, directory: "mipmap-xxhdpi" },
        { ratio: 4, directory: "mipmap-xxxhdpi" },
      ].map(({ ratio, directory }) => {
        const fileName = `${logoFileName}.png`;
        const filePath = path.resolve(resPath, directory, fileName);
        const width = logoWidth * ratio;
        const height = getHeight(width);

        const canvasSize = splashScreenIconSizeNoBackground * ratio;

        // https://github.com/oliver-moran/jimp/tree/master/packages/jimp#creating-new-images
        const canvas = new Jimp(canvasSize, canvasSize, 0xffffff00);
        const logo = image.clone().resize(width, height);

        const x = (canvasSize - width) / 2;
        const y = (canvasSize - height) / 2;

        return canvas
          .blit(logo, x, y)
          .quality(100)
          .writeAsync(filePath)
          .then(() => {
            logWrite("✨", filePath, { width: canvasSize, height: canvasSize });
          });
      }),
    );
  }

  if (ios) {
    log(`\n    ${pc.underline("iOS")}`);

    const { projectPath } = ios;
    const imagesPath = path.resolve(projectPath, "Images.xcassets");

    if (fs.existsSync(projectPath)) {
      const storyboardPath = path.resolve(projectPath, "BootSplash.storyboard");

      fs.writeFileSync(
        storyboardPath,
        getStoryboard({
          height: getHeight(logoWidth),
          width: logoWidth,
          backgroundColor: backgroundColorHex,
        }),
        "utf-8",
      );

      logWrite("✨", storyboardPath);
    } else {
      log(
        `No "${projectPath}" directory found. Skipping iOS storyboard generation…`,
      );
    }

    if (fs.existsSync(imagesPath)) {
      const imageSetPath = path.resolve(imagesPath, xcassetName + ".imageset");
      fs.ensureDirSync(imageSetPath);

      fs.writeFileSync(
        path.resolve(imageSetPath, "Contents.json"),
        ContentsJson,
        "utf-8",
      );

      await Promise.all(
        [
          { ratio: 1, suffix: "" },
          { ratio: 2, suffix: "@2x" },
          { ratio: 3, suffix: "@3x" },
        ].map(({ ratio, suffix }) => {
          const fileName = `${logoFileName}${suffix}.png`;
          const filePath = path.resolve(imageSetPath, fileName);
          const width = logoWidth * ratio;
          const height = getHeight(width);

          return image
            .clone()
            .resize(width, height)
            .quality(100)
            .writeAsync(filePath)
            .then(() => {
              logWrite("✨", filePath, { width, height });
            });
        }),
      );
    } else {
      log(
        `No "${imagesPath}" directory found. Skipping iOS images generation…`,
      );
    }
  }

  log(`
 ${pc.blue("┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓")}
 ${pc.blue("┃")}  💖  ${pc.bold(
    "Love this library? Consider sponsoring!",
  )}  ${pc.blue("┃")}
 ${pc.blue("┃")}  One-time amounts are available.              ${pc.blue("┃")}
 ${pc.blue("┃")}  ${pc.underline(
    "https://github.com/sponsors/zoontek",
  )}          ${pc.blue("┃")}
 ${pc.blue("┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛")}
`);

  log(`✅  Done! Thanks for using ${pc.underline("react-native-bootsplash")}.`);
};
