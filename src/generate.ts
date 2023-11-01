import {
  AndroidProjectConfig,
  CommandFunction,
  IOSProjectConfig,
} from "@react-native-community/cli-types";
import detectIndent from "detect-indent";
import fs from "fs-extra";
import { parse as parseHtml } from "node-html-parser";
import path from "path";
import pc from "picocolors";
import { Options as PrettierOptions } from "prettier";
import * as htmlPlugin from "prettier/plugins/html";
import * as cssPlugin from "prettier/plugins/postcss";
import * as prettier from "prettier/standalone";
import sharp, { Sharp } from "sharp";
import { dedent } from "ts-dedent";
import formatXml, { XMLFormatterOptions } from "xml-formatter";
import { Manifest } from ".";

const workingPath = process.env.INIT_CWD ?? process.env.PWD ?? process.cwd();

export type Color = {
  hex: string;
  rgb: { R: string; G: string; B: string };
};

const parseColor = (value: string): Color => {
  const up = value.toUpperCase().replace(/[^0-9A-F]/g, "");
  const hex = "#" + (up.length === 3 ? up + up : up);

  if (hex.length !== 7) {
    log.error("--background-color value is not a valid hexadecimal color.");
    process.exit(1);
  }

  const rgb: Color["rgb"] = {
    R: (parseInt("" + hex[1] + hex[2], 16) / 255).toPrecision(15),
    G: (parseInt("" + hex[3] + hex[4], 16) / 255).toPrecision(15),
    B: (parseInt("" + hex[5] + hex[6], 16) / 255).toPrecision(15),
  };

  return { hex, rgb };
};

const getStoryboard = ({
  logoHeight,
  logoWidth,
  background: { R, G, B },
}: {
  logoHeight: number;
  logoWidth: number;
  background: Color["rgb"];
}) => {
  const frameWidth = 375;
  const frameHeight = 667;
  const logoX = (frameWidth - logoWidth) / 2;
  const logoY = (frameHeight - logoHeight) / 2;

  return dedent`
<?xml version="1.0" encoding="UTF-8"?>
<document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0" toolsVersion="21701" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none" useAutolayout="YES" launchScreen="YES" useTraitCollections="YES" useSafeAreas="YES" colorMatched="YES" initialViewController="01J-lp-oVM">
    <device id="retina4_7" orientation="portrait" appearance="light"/>
    <dependencies>
        <deployment identifier="iOS"/>
        <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="21678"/>
        <capability name="Safe area layout guides" minToolsVersion="9.0"/>
        <capability name="documents saved in the Xcode 8 format" minToolsVersion="8.0"/>
    </dependencies>
    <scenes>
        <!--View Controller-->
        <scene sceneID="EHf-IW-A2E">
            <objects>
                <viewController modalTransitionStyle="crossDissolve" id="01J-lp-oVM" sceneMemberID="viewController">
                    <view key="view" autoresizesSubviews="NO" contentMode="scaleToFill" id="Ze5-6b-2t3">
                        <rect key="frame" x="0.0" y="0.0" width="${frameWidth}" height="${frameHeight}"/>
                        <autoresizingMask key="autoresizingMask" widthSizable="YES" heightSizable="YES"/>
                        <subviews>
                            <imageView autoresizesSubviews="NO" clipsSubviews="YES" userInteractionEnabled="NO" contentMode="scaleAspectFit" image="BootSplashLogo" translatesAutoresizingMaskIntoConstraints="NO" id="3lX-Ut-9ad">
                                <rect key="frame" x="${logoX}" y="${logoY}" width="${logoWidth}" height="${logoHeight}"/>
                                <accessibility key="accessibilityConfiguration">
                                    <accessibilityTraits key="traits" image="YES" notEnabled="YES"/>
                                </accessibility>
                            </imageView>
                        </subviews>
                        <viewLayoutGuide key="safeArea" id="Bcu-3y-fUS"/>
                        <color key="backgroundColor" red="${R}" green="${G}" blue="${B}" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>
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
        <image name="BootSplashLogo" width="${logoWidth}" height="${logoHeight}"/>
    </resources>
</document>
`;
};

export const log = {
  error: (text: string) => console.log(pc.red(`❌  ${text}`)),
  text: (text: string) => console.log(text),
  title: (emoji: string, text: string) =>
    console.log(`\n${emoji}  ${pc.underline(pc.bold(text))}`),
  warn: (text: string) => console.log(pc.yellow(`⚠️   ${text}`)),
};

export const logWrite = (
  filePath: string,
  dimensions?: { width: number; height: number },
) =>
  console.log(
    `    ${path.relative(workingPath, filePath)}` +
      (dimensions != null ? ` (${dimensions.width}x${dimensions.height})` : ""),
  );

export const writeJson = (file: string, json: object) => {
  fs.writeFileSync(file, JSON.stringify(json, null, 2) + "\n", "utf-8");
  logWrite(file);
};

export const readXml = (file: string) => {
  const xml = fs.readFileSync(file, "utf-8");
  const { indent } = detectIndent(xml);

  const formatOptions: XMLFormatterOptions = {
    indentation: indent || "    ",
  };

  return { root: parseHtml(xml), formatOptions };
};

export const writeXml = (
  file: string,
  xml: string,
  options?: XMLFormatterOptions,
) => {
  const formatted = formatXml(xml, {
    collapseContent: true,
    forceSelfClosingEmptyTag: true,
    indentation: "    ",
    lineSeparator: "\n",
    whiteSpaceAtEndOfSelfclosingTag: true,
    ...options,
  });

  fs.writeFileSync(file, formatted + "\n", "utf-8");
  logWrite(file);
};

export const readHtml = (file: string) => {
  const html = fs.readFileSync(file, "utf-8");
  const { type, amount } = detectIndent(html);

  const formatOptions: PrettierOptions = {
    useTabs: type === "tab",
    tabWidth: amount || 2,
  };

  return { root: parseHtml(html), formatOptions };
};

export const writeHtml = async (
  file: string,
  html: string,
  options?: Omit<PrettierOptions, "parser" | "plugins">,
) => {
  const formatted = await prettier.format(html, {
    parser: "html",
    plugins: [htmlPlugin, cssPlugin],
    tabWidth: 2,
    useTabs: false,
    ...options,
  });

  fs.writeFileSync(file, formatted, "utf-8");
  logWrite(file);
};

const ensureSupportedFormat = async (
  name: string,
  image: Sharp | undefined,
) => {
  if (image == null) {
    return;
  }

  const { format } = await image.metadata();

  if (format !== "png" && format !== "svg") {
    log.error(`${name} image file format (${format}) is not supported`);
    process.exit(1);
  }
};

const getAndroidResPath = (
  android: AndroidProjectConfig,
  {
    brandHeight,
    brandWidth,
    flavor,
    logoHeight,
    logoWidth,
  }: {
    brandHeight: number;
    brandWidth: number;
    flavor: string;
    logoHeight: number;
    logoWidth: number;
  },
): string | undefined => {
  const androidResPath = path.resolve(
    android.sourceDir,
    android.appName,
    "src",
    flavor,
    "res",
  );

  if (!fs.existsSync(androidResPath)) {
    log.warn(
      `No ${path.relative(
        workingPath,
        androidResPath,
      )} directory found. Skipping Android assets generation…`,
    );
  } else if (logoWidth > 288 || logoHeight > 288) {
    log.warn(
      "Logo size exceeding 288x288dp will be cropped by Android. Skipping Android assets generation…",
    );
  } else if (brandHeight > 80 || brandWidth > 200) {
    log.warn(
      "Brand size exceeding 200x80dp will be cropped by Android. Skipping Android assets generation…",
    );
  } else {
    if (logoWidth > 192 || logoHeight > 192) {
      log.warn(`Logo size exceeds 192x192dp. It might be cropped by Android.`);
    }

    return androidResPath;
  }
};

const getIOSProjectPath = (ios: IOSProjectConfig): string | undefined => {
  if (ios.xcodeProject == null) {
    log.warn("No Xcode project found. Skipping iOS assets generation…");
    return;
  }

  const iosProjectPath = path
    .resolve(ios.sourceDir, ios.xcodeProject.name)
    .replace(/\.(xcodeproj|xcworkspace)$/, "");

  if (!fs.existsSync(iosProjectPath)) {
    log.warn(
      `No ${path.relative(
        workingPath,
        iosProjectPath,
      )} directory found. Skipping iOS assets generation…`,
    );
  } else {
    return iosProjectPath;
  }
};

const getHtmlTemplatePath = (html: string): string | undefined => {
  const htmlTemplatePath = path.resolve(workingPath, html);

  if (!fs.existsSync(htmlTemplatePath)) {
    log.warn(
      `No ${path.relative(
        workingPath,
        htmlTemplatePath,
      )} file found. Skipping HTML + CSS generation…`,
    );
  } else {
    return htmlTemplatePath;
  }
};

export type AddonConfig = {
  licenseKey: string;

  androidResPath: string | undefined;
  iosProjectPath: string | undefined;
  htmlTemplatePath: string | undefined;
  assetsOutputPath: string | undefined;

  logoPath: string;
  darkLogoPath: string | undefined;
  brandPath: string | undefined;
  darkBrandPath: string | undefined;

  logoHeight: number;
  logoWidth: number;
  brandHeight: number;
  brandWidth: number;

  background: Color;
  logo: Sharp;
  brand: Sharp | undefined;

  darkBackground: Color | undefined;
  darkLogo: Sharp | undefined;
  darkBrand: Sharp | undefined;
};

const requireAddon = ():
  | { execute: (config: AddonConfig) => Promise<void> }
  | undefined => {
  try {
    // eslint-disable-next-line
    return require("./addon");
  } catch {
    return;
  }
};

export const generate: CommandFunction<{
  platforms: string[];
  background: string;
  logoWidth: number;
  assetsOutput?: string;
  html: string;
  flavor: string;

  licenseKey?: string;
  brand?: string;
  brandWidth: number;
  darkBackground?: string;
  darkLogo?: string;
  darkBrand?: string;
}> = async (
  [argsLogo],
  { project: { android, ios } },
  { platforms, html, flavor, licenseKey, ...args },
) => {
  const [nodeStringVersion = ""] = process.versions.node.split(".");
  const nodeVersion = parseInt(nodeStringVersion, 10);

  if (!isNaN(nodeVersion) && nodeVersion < 18) {
    log.error("Requires Node 18 (or higher)");
    process.exit(1);
  }

  if (argsLogo == null) {
    log.error("Missing required argument 'logo'");
    process.exit(1);
  }

  const logoPath = path.resolve(workingPath, argsLogo);

  const darkLogoPath =
    args.darkLogo != null
      ? path.resolve(workingPath, args.darkLogo)
      : undefined;

  const brandPath =
    args.brand != null ? path.resolve(workingPath, args.brand) : undefined;

  const darkBrandPath =
    args.darkBrand != null
      ? path.resolve(workingPath, args.darkBrand)
      : undefined;

  const assetsOutputPath =
    args.assetsOutput != null
      ? path.resolve(workingPath, args.assetsOutput)
      : undefined;

  const logo = sharp(logoPath);
  const darkLogo = darkLogoPath != null ? sharp(darkLogoPath) : undefined;
  const brand = brandPath != null ? sharp(brandPath) : undefined;
  const darkBrand = darkBrandPath != null ? sharp(darkBrandPath) : undefined;

  const background = parseColor(args.background);
  const logoWidth = args.logoWidth - (args.logoWidth % 2);
  const brandWidth = args.brandWidth - (args.brandWidth % 2);

  const darkBackground =
    args.darkBackground != null ? parseColor(args.darkBackground) : undefined;

  const executeAddon =
    brand != null ||
    darkBackground != null ||
    darkLogo != null ||
    darkBrand != null;

  if (licenseKey != null && !executeAddon) {
    log.warn(
      `You specified a license key but none of the options that requires it.`,
    );
  }

  if (licenseKey == null && executeAddon) {
    const options = [
      brand != null ? "brand" : "",
      darkBackground != null ? "dark-background" : "",
      darkLogo != null ? "dark-logo" : "",
      darkBrand != null ? "dark-brand" : "",
    ]
      .filter((option) => option !== "")
      .map((option) => `--${option}`)
      .join(", ");

    log.error(`You need to specify a license key in order to use ${options}.`);
    process.exit(1);
  }

  if (brand == null && darkBrand != null) {
    log.error("--dark-brand option couldn't be used without --brand.");
    process.exit(1);
  }

  await ensureSupportedFormat("Logo", logo);
  await ensureSupportedFormat("Dark logo", darkLogo);
  await ensureSupportedFormat("Brand", brand);
  await ensureSupportedFormat("Dark brand", darkBrand);

  const logoHeight = await logo
    .clone()
    .resize(logoWidth)
    .toBuffer()
    .then((buffer) => sharp(buffer).metadata())
    .then(({ height = 0 }) => Math.round(height));

  const brandHeight =
    (await brand
      ?.clone()
      .resize(brandWidth)
      .toBuffer()
      .then((buffer) => sharp(buffer).metadata())
      .then(({ height = 0 }) => Math.round(height))) ?? 0;

  if (logoWidth < args.logoWidth) {
    log.warn(
      `Logo width must be a multiple of 2. It has been rounded to ${logoWidth}dp.`,
    );
  }
  if (brandWidth < args.brandWidth) {
    log.warn(
      `Brand width must be a multiple of 2. It has been rounded to ${brandWidth}dp.`,
    );
  }

  const androidResPath =
    platforms.includes("android") && android != null
      ? getAndroidResPath(android, {
          brandHeight,
          brandWidth,
          flavor,
          logoHeight,
          logoWidth,
        })
      : undefined;

  const iosProjectPath =
    platforms.includes("ios") && ios != null
      ? getIOSProjectPath(ios)
      : undefined;

  const htmlTemplatePath = platforms.includes("web")
    ? getHtmlTemplatePath(html)
    : undefined;

  if (androidResPath != null) {
    log.title("🤖", "Android");

    const valuesPath = path.resolve(androidResPath, "values");
    fs.ensureDirSync(valuesPath);

    const colorsXmlPath = path.resolve(valuesPath, "colors.xml");
    const colorsXmlEntry = `<color name="bootsplash_background">${background.hex}</color>`;

    if (fs.existsSync(colorsXmlPath)) {
      const { root, formatOptions } = readXml(colorsXmlPath);
      const nextColor = parseHtml(colorsXmlEntry);
      const prevColor = root.querySelector(
        'color[name="bootsplash_background"]',
      );

      if (prevColor != null) {
        prevColor.replaceWith(nextColor);
      } else {
        root.querySelector("resources")?.appendChild(nextColor);
      }

      writeXml(colorsXmlPath, root.toString(), formatOptions);
    } else {
      writeXml(colorsXmlPath, `<resources>${colorsXmlEntry}</resources>`);
    }

    await Promise.all(
      [
        { ratio: 1, suffix: "mdpi" },
        { ratio: 1.5, suffix: "hdpi" },
        { ratio: 2, suffix: "xhdpi" },
        { ratio: 3, suffix: "xxhdpi" },
        { ratio: 4, suffix: "xxxhdpi" },
      ].map(({ ratio, suffix }) => {
        const drawableDirPath = path.resolve(
          androidResPath,
          `drawable-${suffix}`,
        );

        fs.ensureDirSync(drawableDirPath);

        // https://developer.android.com/develop/ui/views/launch/splash-screen#dimensions
        const canvasSize = 288 * ratio;

        // https://sharp.pixelplumbing.com/api-constructor
        const canvas = sharp({
          create: {
            width: canvasSize,
            height: canvasSize,
            channels: 4,
            background: {
              r: 255,
              g: 255,
              b: 255,
              alpha: 0,
            },
          },
        });

        const filePath = path.resolve(drawableDirPath, "bootsplash_logo.png");

        return logo
          .clone()
          .resize(logoWidth * ratio)
          .toBuffer()
          .then((input) =>
            canvas
              .composite([{ input }])
              .png({ quality: 100 })
              .toFile(filePath),
          )
          .then(() => {
            logWrite(filePath, {
              width: canvasSize,
              height: canvasSize,
            });
          });
      }),
    );
  }

  if (iosProjectPath != null) {
    log.title("🍏", "iOS");

    const storyboardPath = path.resolve(
      iosProjectPath,
      "BootSplash.storyboard",
    );

    writeXml(
      storyboardPath,
      getStoryboard({
        logoHeight,
        logoWidth,
        background: background.rgb,
      }),
      { whiteSpaceAtEndOfSelfclosingTag: false },
    );

    const imageSetPath = path.resolve(
      iosProjectPath,
      "Images.xcassets",
      "BootSplashLogo.imageset",
    );

    fs.ensureDirSync(imageSetPath);

    writeJson(path.resolve(imageSetPath, "Contents.json"), {
      images: [
        {
          idiom: "universal",
          filename: "bootsplash_logo.png",
          scale: "1x",
        },
        {
          idiom: "universal",
          filename: "bootsplash_logo@2x.png",
          scale: "2x",
        },
        {
          idiom: "universal",
          filename: "bootsplash_logo@3x.png",
          scale: "3x",
        },
      ],
      info: {
        author: "xcode",
        version: 1,
      },
    });

    await Promise.all(
      [
        { ratio: 1, suffix: "" },
        { ratio: 2, suffix: "@2x" },
        { ratio: 3, suffix: "@3x" },
      ].map(({ ratio, suffix }) => {
        const filePath = path.resolve(
          imageSetPath,
          `bootsplash_logo${suffix}.png`,
        );

        return logo
          .clone()
          .resize(logoWidth * ratio)
          .png({ quality: 100 })
          .toFile(filePath)
          .then(({ width, height }) => {
            logWrite(filePath, { width, height });
          });
      }),
    );
  }

  if (htmlTemplatePath != null) {
    log.title("🌐", "Web");

    const { root, formatOptions } = readHtml(htmlTemplatePath);
    const { format } = await logo.metadata();
    const prevStyle = root.querySelector("#bootsplash-style");

    const base64 = (
      format === "svg"
        ? fs.readFileSync(logoPath)
        : await logo
            .clone()
            .resize(Math.round(logoWidth * 2))
            .png({ quality: 100 })
            .toBuffer()
    ).toString("base64");

    const dataURI = `data:image/${format ? "svg+xml" : "png"};base64,${base64}`;

    const nextStyle = parseHtml(dedent`
      <style id="bootsplash-style">
        #bootsplash {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          right: 0;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: ${background.hex};
        }
        #bootsplash-logo {
          content: url("${dataURI}");
          width: ${logoWidth}px;
          height: ${logoHeight}px;
        }
      </style>
    `);

    if (prevStyle != null) {
      prevStyle.replaceWith(nextStyle);
    } else {
      root.querySelector("head")?.appendChild(nextStyle);
    }

    const prevDiv = root.querySelector("#bootsplash");

    const nextDiv = parseHtml(dedent`
      <div id="bootsplash">
        <div id="bootsplash-logo"></div>
      </div>
    `);

    if (prevDiv != null) {
      prevDiv.replaceWith(nextDiv);
    } else {
      root.querySelector("body")?.appendChild(nextDiv);
    }

    await writeHtml(htmlTemplatePath, root.toString(), formatOptions);
  }

  if (assetsOutputPath != null) {
    log.title("📄", "Assets");

    fs.ensureDirSync(assetsOutputPath);

    writeJson(path.resolve(assetsOutputPath, "bootsplash_manifest.json"), {
      background: background.hex,
      logo: {
        width: logoWidth,
        height: logoHeight,
      },
    } satisfies Manifest);

    await Promise.all(
      [
        { ratio: 1, suffix: "" },
        { ratio: 1.5, suffix: "@1,5x" },
        { ratio: 2, suffix: "@2x" },
        { ratio: 3, suffix: "@3x" },
        { ratio: 4, suffix: "@4x" },
      ].map(({ ratio, suffix }) => {
        const filePath = path.resolve(
          assetsOutputPath,
          `bootsplash_logo${suffix}.png`,
        );

        return logo
          .clone()
          .resize(Math.round(logoWidth * ratio))
          .png({ quality: 100 })
          .toFile(filePath)
          .then(({ width, height }) => {
            logWrite(filePath, { width, height });
          });
      }),
    );
  }

  if (licenseKey != null && executeAddon) {
    const addon = requireAddon();

    await addon?.execute({
      licenseKey,

      androidResPath,
      iosProjectPath,
      htmlTemplatePath,
      assetsOutputPath,

      logoHeight,
      logoWidth,
      brandHeight,
      brandWidth,

      logoPath,
      darkLogoPath,
      brandPath,
      darkBrandPath,

      background,
      logo,
      brand,

      darkBackground,
      darkLogo,
      darkBrand,
    });
  } else {
    log.text(`
${pc.blue("┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓")}
${pc.blue("┃")}  🔑  ${pc.bold(
      "Get a license key for brand image / dark mode support",
    )}  ${pc.blue("┃")}
${pc.blue("┃")}      ${pc.underline(
      "https://zoontek.gumroad.com/l/bootsplash-generator",
    )}     ${pc.blue("┃")}
${pc.blue("┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛")}`);
  }

  log.text(`\n💖  Thanks for using ${pc.underline("react-native-bootsplash")}`);
};
