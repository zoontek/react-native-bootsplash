import * as Expo from "@expo/config-plugins";
import { assignColorValue } from "@expo/config-plugins/build/android/Colors";
import { addImports } from "@expo/config-plugins/build/android/codeMod";
import { mergeContents } from "@expo/config-plugins/build/utils/generateCode";
import ExpoPlist from "@expo/plist";
import { projectConfig as getAndroidProjectConfig } from "@react-native-community/cli-config-android";
import { getProjectConfig as getAppleProjectConfig } from "@react-native-community/cli-config-apple";
import { findProjectRoot } from "@react-native-community/cli-tools";
import childProcess from "child_process";
import crypto from "crypto";
import detectIndent, { type Indent } from "detect-indent";
import fs from "fs-extra";
import { HTMLElement, parse as parseHtml } from "node-html-parser";
import path from "path";
import pc from "picocolors";
import type { Options as PrettierOptions } from "prettier";
import * as htmlPlugin from "prettier/plugins/html";
import * as cssPlugin from "prettier/plugins/postcss";
import * as prettier from "prettier/standalone";
import semver from "semver";
import sharp, { type Sharp } from "sharp";
import { dedent } from "ts-dedent";
import util from "util";
import formatXml, { type XMLFormatterOptions } from "xml-formatter";
import type { Manifest } from ".";

const PACKAGE_NAME = "react-native-bootsplash";

let isExpo = false;

export const workingPath =
  process.env.INIT_CWD ?? process.env.PWD ?? process.cwd();

const projectRoot = findProjectRoot(workingPath);

export type Platforms = ("android" | "ios" | "web")[];

export type RGBColor = {
  R: string;
  G: string;
  B: string;
};

type Color = {
  hex: string;
  rgb: RGBColor;
};

const promisifiedExec = util.promisify(childProcess.exec);

const exec = (cmd: string) =>
  promisifiedExec(cmd).then(({ stdout, stderr }) => stdout || stderr);

export const log = {
  error: (text: string) => {
    console.log(
      pc.red(isExpo ? `❌ [${PACKAGE_NAME}] ${text}` : `❌  ${text}`),
    );
  },
  title: (emoji: string, text: string) => {
    if (!isExpo) {
      console.log(`\n${emoji}  ${pc.underline(pc.bold(text))}`);
    }
  },
  warn: (text: string) => {
    console.log(
      pc.yellow(isExpo ? `⚠️  [${PACKAGE_NAME}] ${text}` : `⚠️  ${text}`),
    );
  },
  write: (filePath: string, dimensions?: { width: number; height: number }) => {
    if (!isExpo) {
      console.log(
        `    ${path.relative(workingPath, filePath)}` +
          (dimensions != null
            ? ` (${dimensions.width}x${dimensions.height})`
            : ""),
      );
    }
  },
};

const parseColor = (value: string): Color => {
  const up = value.toUpperCase().replace(/[^0-9A-F]/g, "");

  if (up.length !== 3 && up.length !== 6) {
    log.error(`"${value}" value is not a valid hexadecimal color.`);
    process.exit(1);
  }

  const hex =
    up.length === 3
      ? "#" + up[0] + up[0] + up[1] + up[1] + up[2] + up[2]
      : "#" + up;

  const rgb: Color["rgb"] = {
    R: (Number.parseInt("" + hex[1] + hex[2], 16) / 255).toPrecision(15),
    G: (Number.parseInt("" + hex[3] + hex[4], 16) / 255).toPrecision(15),
    B: (Number.parseInt("" + hex[5] + hex[6], 16) / 255).toPrecision(15),
  };

  return { hex: hex.toLowerCase(), rgb };
};

const getStoryboard = ({ props, extras }: { props: Props; extras: Extras }) => {
  const { background, logo } = props;
  const { fileNameSuffix, logoHeight } = extras;

  const { R, G, B } = background.rgb;
  const frameWidth = 375;
  const frameHeight = 667;

  return dedent`
<?xml version="1.0" encoding="UTF-8"?>
<document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0" toolsVersion="21701" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none" useAutolayout="YES" launchScreen="YES" useTraitCollections="YES" useSafeAreas="YES" colorMatched="YES" initialViewController="01J-lp-oVM">
    <device id="retina4_7" orientation="portrait" appearance="light"/>
    <dependencies>
        <deployment identifier="iOS"/>
        <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="21678"/>
        <capability name="Named colors" minToolsVersion="9.0"/>
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
                            <imageView autoresizesSubviews="NO" clipsSubviews="YES" userInteractionEnabled="NO" contentMode="scaleAspectFit" image="BootSplashLogo-${fileNameSuffix}" translatesAutoresizingMaskIntoConstraints="NO" id="3lX-Ut-9ad">
                                <rect key="frame" x="${(frameWidth - logo.width) / 2}" y="${(frameHeight - logoHeight) / 2}" width="${logo.width}" height="${logoHeight}"/>
                                <accessibility key="accessibilityConfiguration">
                                    <accessibilityTraits key="traits" image="YES" notEnabled="YES"/>
                                </accessibility>
                            </imageView>
                        </subviews>
                        <viewLayoutGuide key="safeArea" id="Bcu-3y-fUS"/>
                        <color key="backgroundColor" name="BootSplashBackground-${fileNameSuffix}"/>
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
        <image name="BootSplashLogo-${fileNameSuffix}" width="${logo.width}" height="${logoHeight}"/>
        <namedColor name="BootSplashBackground-${fileNameSuffix}">
            <color red="${R}" green="${G}" blue="${B}" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>
        </namedColor>
    </resources>
</document>
`;
};

// Freely inspired by https://github.com/humanwhocodes/humanfs
export const hfs = {
  buffer: (path: string) => fs.readFileSync(path),
  exists: (path: string) => fs.existsSync(path),
  isDir: (path: string) => fs.lstatSync(path).isDirectory(),
  json: (path: string) => JSON.parse(fs.readFileSync(path, "utf-8")) as unknown,
  readDir: (path: string) => fs.readdirSync(path, "utf-8"),
  realPath: (path: string) => fs.realpathSync(path, "utf-8"),
  rm: (path: string) => fs.rmSync(path, { force: true, recursive: true }),
  text: (path: string) => fs.readFileSync(path, "utf-8"),

  ensureDir: (dir: string) => {
    fs.mkdirSync(dir, { recursive: true });
  },
  write: (path: string, content: string) => {
    const trimmed = content.trim();
    fs.writeFileSync(path, trimmed === "" ? trimmed : trimmed + "\n", "utf-8");
  },
};

export const writeJson = (filePath: string, content: object) => {
  hfs.write(filePath, JSON.stringify(content, null, 2));
  log.write(filePath);
};

type FormatOptions = { indent?: Indent } & (
  | {
      formatter: "prettier";
      selfClosingTags?: boolean;
      useCssPlugin?: boolean;
      htmlWhitespaceSensitivity?: PrettierOptions["htmlWhitespaceSensitivity"];
      singleAttributePerLine?: PrettierOptions["singleAttributePerLine"];
    }
  | {
      formatter: "xmlFormatter";
      whiteSpaceAtEndOfSelfclosingTag?: XMLFormatterOptions["whiteSpaceAtEndOfSelfclosingTag"];
    }
);

export const readXmlLike = (filePath: string) => {
  const content = hfs.text(filePath);

  return {
    root: parseHtml(content),
    formatOptions: { indent: detectIndent(content) },
  };
};

export const writeXmlLike = async (
  filePath: string,
  content: string,
  { indent, ...formatOptions }: FormatOptions,
) => {
  if (formatOptions.formatter === "prettier") {
    const {
      formatter,
      useCssPlugin = false,
      selfClosingTags = false,
      ...options
    } = formatOptions;

    const formatted = await prettier.format(content, {
      parser: "html",
      bracketSameLine: true,
      printWidth: 10000,
      plugins: [htmlPlugin, ...(useCssPlugin ? [cssPlugin] : [])],
      useTabs: indent?.type === "tab",
      tabWidth: (indent?.amount ?? 0) || 2,
      ...options,
    });

    hfs.write(
      filePath,
      selfClosingTags
        ? formatted.replace(/><\/[a-z-0-9]+>/gi, " />")
        : formatted,
    );

    log.write(filePath);
  } else {
    const { formatter, ...options } = formatOptions;

    const formatted = formatXml(content, {
      collapseContent: true,
      forceSelfClosingEmptyTag: true,
      lineSeparator: "\n",
      whiteSpaceAtEndOfSelfclosingTag: true,
      indentation: (indent?.indent ?? "") || "    ",
      ...options,
    });

    hfs.write(filePath, formatted);
    log.write(filePath);
  }
};

export type Asset = {
  path: string;
  image: Sharp;
  width: number;
};

const getAssetBase64 = async (
  name: string,
  asset: Asset | undefined,
): Promise<string> => {
  if (asset == null) {
    return "";
  }

  const { image, width } = asset;
  const { format } = await image.metadata();

  if (format !== "png" && format !== "svg") {
    log.error(`${name} image file format (${format}) is not supported`);
    process.exit(1);
  }

  const buffer = await image
    .clone()
    .resize(width)
    .png({ quality: 100 })
    .toBuffer();

  return buffer.toString("base64");
};

const getAndroidOutputPath = ({
  flavor,
  platforms,
}: {
  flavor: string;
  platforms: Platforms;
}) => {
  const android = getAndroidProjectConfig(projectRoot);

  if (!platforms.includes("android") || android == null) {
    return;
  }

  const androidOutputPath = path.resolve(
    android.sourceDir,
    android.appName,
    "src",
    flavor,
    "res",
  );

  if (!hfs.exists(androidOutputPath)) {
    return log.warn(
      `No ${path.relative(
        workingPath,
        androidOutputPath,
      )} directory found. Skipping Android assets generation…`,
    );
  }

  return androidOutputPath;
};

const getIOSOutputPath = ({ platforms }: { platforms: Platforms }) => {
  const ios = getAppleProjectConfig({ platformName: "ios" })(projectRoot, {});

  if (!platforms.includes("ios") || ios == null) {
    return;
  }
  if (ios.xcodeProject == null) {
    return log.warn("No Xcode project found. Skipping iOS assets generation…");
  }

  const iosOutputPath = path
    .resolve(ios.sourceDir, ios.xcodeProject.name)
    .replace(/\.(xcodeproj|xcworkspace)$/, "");

  if (!hfs.exists(iosOutputPath)) {
    return log.warn(
      `No ${path.relative(
        workingPath,
        iosOutputPath,
      )} directory found. Skipping iOS assets generation…`,
    );
  }

  return iosOutputPath;
};

const getHtmlTemplatePath = ({
  html,
  platforms,
}: {
  html: string;
  platforms: Platforms;
}) => {
  if (!platforms.includes("web")) {
    return;
  }

  const htmlTemplatePath = path.resolve(workingPath, html);

  if (!hfs.exists(htmlTemplatePath)) {
    return log.warn(
      `No ${path.relative(
        workingPath,
        htmlTemplatePath,
      )} found. Skipping HTML + CSS generation…`,
    );
  }

  return htmlTemplatePath;
};

const getInfoPlistPath = ({
  iosOutputPath,
  plist,
}: {
  iosOutputPath: string;
  plist: string | undefined;
}) => {
  if (plist != null) {
    const infoPlistPath = path.resolve(workingPath, plist);

    if (!hfs.exists(infoPlistPath)) {
      return log.warn(`No ${path.relative(workingPath, infoPlistPath)} found`);
    }

    return infoPlistPath;
  }

  return path.resolve(iosOutputPath, "Info.plist");
};

const getAssetHeight = (asset: Asset | undefined): Promise<number> => {
  if (asset == null) {
    return Promise.resolve(0);
  }

  return asset.image
    .clone()
    .resize(asset.width)
    .toBuffer()
    .then((buffer) => sharp(buffer).metadata())
    .then(({ height = 0 }) => Math.round(height));
};

type Config = {
  logo: string;
  background: string;
  logoWidth: number;
  assetsOutput: string;

  licenseKey?: string;
  brand?: string;
  brandWidth: number;
  darkBackground?: string;
  darkLogo?: string;
  darkBrand?: string;

  android?: {
    darkContentBarsStyle?: boolean;
  };
};

const getProps = ({ android = {}, licenseKey, ...config }: Config) => {
  if (semver.lt(process.versions.node, "20.0.0")) {
    log.error("Requires Node 20 (or higher)");
    process.exit(1);
  }

  const assetsOutputPath = path.resolve(workingPath, config.assetsOutput);
  const logoPath = path.resolve(workingPath, config.logo);

  const darkLogoPath =
    config.darkLogo != null
      ? path.resolve(workingPath, config.darkLogo)
      : undefined;

  const brandPath =
    config.brand != null ? path.resolve(workingPath, config.brand) : undefined;

  const darkBrandPath =
    config.darkBrand != null
      ? path.resolve(workingPath, config.darkBrand)
      : undefined;

  const logoWidth = config.logoWidth - (config.logoWidth % 2);
  const brandWidth = config.brandWidth - (config.brandWidth % 2);

  const logo: Asset = {
    path: logoPath,
    image: sharp(logoPath),
    width: logoWidth,
  };

  const darkLogo: Asset | undefined =
    darkLogoPath != null
      ? { path: darkLogoPath, image: sharp(darkLogoPath), width: logoWidth }
      : undefined;

  const brand: Asset | undefined =
    brandPath != null
      ? { path: brandPath, image: sharp(brandPath), width: brandWidth }
      : undefined;

  const darkBrand: Asset | undefined =
    darkBrandPath != null
      ? { path: darkBrandPath, image: sharp(darkBrandPath), width: brandWidth }
      : undefined;

  const background = parseColor(config.background);

  const darkBackground =
    config.darkBackground != null
      ? parseColor(config.darkBackground)
      : undefined;

  const executeAddon =
    brand != null ||
    darkBackground != null ||
    darkLogo != null ||
    darkBrand != null;

  if (licenseKey != null && !executeAddon) {
    log.warn(
      "You specified a license key but none of the options that requires it.",
    );
  }

  const optionNames = {
    brand: isExpo ? "brand" : "--brand",
    darkBackground: isExpo ? "darkBackground" : "--dark-background",
    darkLogo: isExpo ? "darkLogo" : "--dark-logo",
    darkBrand: isExpo ? "darkBrand" : "--dark-brand",
  };

  if (licenseKey == null && executeAddon) {
    const options = [
      brand != null ? optionNames.brand : "",
      darkBackground != null ? optionNames.darkBackground : "",
      darkLogo != null ? optionNames.darkLogo : "",
      darkBrand != null ? optionNames.darkBrand : "",
    ]
      .filter((option) => option !== "")
      .join(", ");

    log.error(`You need to specify a license key in order to use ${options}.`);
    process.exit(1);
  }

  if (brand == null && darkBrand != null) {
    log.error(
      `${optionNames.darkBrand} option couldn't be used without ${optionNames.brand}.`,
    );

    process.exit(1);
  }

  if (logoWidth < config.logoWidth) {
    log.warn(
      `Logo width must be a multiple of 2. It has been rounded to ${logoWidth}dp.`,
    );
  }
  if (brandWidth < config.brandWidth) {
    log.warn(
      `Brand width must be a multiple of 2. It has been rounded to ${brandWidth}dp.`,
    );
  }

  return {
    android,
    assetsOutputPath,
    licenseKey,
    executeAddon,
    background,
    darkBackground,
    logo,
    darkLogo,
    brand,
    darkBrand,
  };
};

export type Props = ReturnType<typeof getProps>;

export const getExtras = async ({
  background,
  darkBackground,
  logo,
  darkLogo,
  brand,
  darkBrand,
}: Props) => {
  const [
    logoHash,
    darkLogoHash,
    brandHash,
    darkBrandHash,

    logoHeight,
    brandHeight,
  ] = await Promise.all([
    getAssetBase64("Logo", logo),
    getAssetBase64("Dark logo", darkLogo),
    getAssetBase64("Brand", brand),
    getAssetBase64("Dark brand", darkBrand),

    getAssetHeight(logo),
    getAssetHeight(brand),
  ]);

  const record: Record<string, string> = {
    background: background.hex,
    darkBackground: darkBackground?.hex ?? "",
    logo: logoHash,
    darkLogo: darkLogoHash,
    brand: brandHash,
    darkBrand: darkBrandHash,
  };

  const stableKey = Object.keys(record)
    .sort()
    .map((key) => record[key])
    .join();

  const fileNameSuffix = crypto
    .createHash("shake256", { outputLength: 3 })
    .update(stableKey)
    .digest("hex")
    .toLowerCase();

  return {
    fileNameSuffix,
    logoHeight,
    brandHeight,
  };
};

export type Extras = Awaited<ReturnType<typeof getExtras>>;

export const writeAndroidAssets = async ({
  androidOutputPath,
  props,
  extras,
}: {
  androidOutputPath: string;
  props: Props;
  extras: Extras;
}) => {
  const { logo, brand } = props;

  if (logo.width > 192 || extras.logoHeight > 192) {
    return log.warn(
      "Logo size exceeding 192x192dp will be cropped by Android. Skipping Android assets generation…",
    );
  }

  if (brand != null && (brand.width > 200 || extras.brandHeight > 80)) {
    return log.warn(
      "Brand size exceeding 200x80dp will be cropped by Android. Skipping Android assets generation…",
    );
  }

  if (logo.width > 134 || extras.logoHeight > 134) {
    log.warn("Logo size exceeds 134x134dp. It might be cropped by Android.");
  }

  log.title("🤖", "Android");
  hfs.ensureDir(androidOutputPath);

  await Promise.all(
    [
      { ratio: 1, suffix: "mdpi" },
      { ratio: 1.5, suffix: "hdpi" },
      { ratio: 2, suffix: "xhdpi" },
      { ratio: 3, suffix: "xxhdpi" },
      { ratio: 4, suffix: "xxxhdpi" },
    ].map(({ ratio, suffix }) => {
      const drawableDirPath = path.resolve(
        androidOutputPath,
        `drawable-${suffix}`,
      );

      hfs.ensureDir(drawableDirPath);

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

      return logo.image
        .clone()
        .resize(logo.width * ratio)
        .toBuffer()
        .then((input) =>
          canvas.composite([{ input }]).png({ quality: 100 }).toFile(filePath),
        )
        .then(() => {
          log.write(filePath, {
            width: canvasSize,
            height: canvasSize,
          });
        });
    }),
  );
};

export const writeIOSAssets = async ({
  iosOutputPath,
  props,
  extras,
}: {
  iosOutputPath: string;
  props: Props;
  extras: Extras;
}) => {
  const { background, logo } = props;

  log.title("🍏", "iOS");
  hfs.ensureDir(iosOutputPath);

  // clean existing assets
  hfs
    .readDir(iosOutputPath)
    .filter((file) => file === "Colors.xcassets" || file === "Images.xcassets")
    .map((file) => path.join(iosOutputPath, file))
    .flatMap((dir) =>
      hfs
        .readDir(dir)
        .filter((file) => file.startsWith("BootSplash"))
        .map((file) => path.join(dir, file)),
    )
    .forEach((file) => {
      hfs.rm(file);
    });

  const storyboardPath = path.resolve(iosOutputPath, "BootSplash.storyboard");

  await writeXmlLike(storyboardPath, getStoryboard({ props, extras }), {
    formatter: "xmlFormatter",
    whiteSpaceAtEndOfSelfclosingTag: false,
  });

  const colorsSetPath = path.resolve(
    iosOutputPath,
    "Colors.xcassets",
    `BootSplashBackground-${extras.fileNameSuffix}.colorset`,
  );

  hfs.ensureDir(colorsSetPath);

  writeJson(path.resolve(colorsSetPath, "Contents.json"), {
    colors: [
      {
        idiom: "universal",
        color: {
          "color-space": "srgb",
          components: {
            blue: background.rgb.B,
            green: background.rgb.G,
            red: background.rgb.R,
            alpha: "1.000",
          },
        },
      },
    ],
    info: {
      author: "xcode",
      version: 1,
    },
  });

  const logoFileName = `logo-${extras.fileNameSuffix}`;

  const imagesSetPath = path.resolve(
    iosOutputPath,
    "Images.xcassets",
    `BootSplashLogo-${extras.fileNameSuffix}.imageset`,
  );

  hfs.ensureDir(imagesSetPath);

  writeJson(path.resolve(imagesSetPath, "Contents.json"), {
    images: [
      {
        idiom: "universal",
        filename: `${logoFileName}.png`,
        scale: "1x",
      },
      {
        idiom: "universal",
        filename: `${logoFileName}@2x.png`,
        scale: "2x",
      },
      {
        idiom: "universal",
        filename: `${logoFileName}@3x.png`,
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
        imagesSetPath,
        `${logoFileName}${suffix}.png`,
      );

      return logo.image
        .clone()
        .resize(logo.width * ratio)
        .png({ quality: 100 })
        .toFile(filePath)
        .then(({ width, height }) => {
          log.write(filePath, { width, height });
        });
    }),
  );
};

export const writeWebAssets = async ({
  htmlTemplatePath,
  props,
  extras,
}: {
  htmlTemplatePath: string;
  props: Props;
  extras: Extras;
}) => {
  const { background, logo } = props;

  log.title("🌐", "Web");

  const htmlTemplate = readXmlLike(htmlTemplatePath);
  const { format } = await logo.image.metadata();
  const prevStyle = htmlTemplate.root.querySelector("#bootsplash-style");

  const base64 = (
    format === "svg"
      ? hfs.buffer(logo.path)
      : await logo.image
          .clone()
          .resize(Math.round(logo.width * 2))
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
        width: ${logo.width}px;
        height: ${extras.logoHeight}px;
      }
    </style>
  `);

  if (prevStyle != null) {
    prevStyle.replaceWith(nextStyle);
  } else {
    htmlTemplate.root.querySelector("head")?.appendChild(nextStyle);
  }

  const prevDiv = htmlTemplate.root.querySelector("#bootsplash");

  const nextDiv = parseHtml(dedent`
    <div id="bootsplash">
      <div id="bootsplash-logo"></div>
    </div>
  `);

  if (prevDiv != null) {
    prevDiv.replaceWith(nextDiv);
  } else {
    htmlTemplate.root.querySelector("body")?.appendChild(nextDiv);
  }

  await writeXmlLike(htmlTemplatePath, htmlTemplate.root.toString(), {
    ...htmlTemplate.formatOptions,
    formatter: "prettier",
    useCssPlugin: true,
  });
};

export const writeGenericAssets = async ({
  props,
  extras,
}: {
  props: Props;
  extras: Extras;
}) => {
  const { assetsOutputPath, background, logo } = props;

  log.title("📄", "Assets");
  hfs.ensureDir(assetsOutputPath);

  writeJson(path.resolve(assetsOutputPath, "manifest.json"), {
    background: background.hex,
    logo: {
      width: logo.width,
      height: extras.logoHeight,
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
      const filePath = path.resolve(assetsOutputPath, `logo${suffix}.png`);

      return logo.image
        .clone()
        .resize(Math.round(logo.width * ratio))
        .png({ quality: 100 })
        .toFile(filePath)
        .then(({ width, height }) => {
          log.write(filePath, { width, height });
        });
    }),
  );
};

export type AddonConfig = {
  props: Props;
  extras: Extras;

  androidOutputPath: string | void;
  iosOutputPath: string | void;
  htmlTemplatePath: string | void;
};

const requireAddon = ():
  | {
      execute: (config: AddonConfig) => Promise<void>;

      withAndroidAssets: Expo.ConfigPlugin<Props>;
      withAndroidColorsNight: Expo.ConfigPlugin<Props>;
      withIOSAssets: Expo.ConfigPlugin<Props>;
      withWebAssets: Expo.ConfigPlugin<Props>;
      withGenericAssets: Expo.ConfigPlugin<Props>;
    }
  | undefined => {
  try {
    return require("./addon");
  } catch {
    return;
  }
};

export const generate = async ({
  platforms,
  html,
  flavor,
  plist,
  ...config
}: {
  platforms: Platforms;
  html: string;
  flavor: string;
  plist?: string;

  logo: string;
  background: string;
  logoWidth: number;
  assetsOutput: string;
  licenseKey?: string;
  brand?: string;
  brandWidth: number;
  darkBackground?: string;
  darkLogo?: string;
  darkBrand?: string;
}) => {
  const props = getProps(config);
  const { background, brand, licenseKey, executeAddon } = props;
  const extras = await getExtras(props);

  const androidOutputPath = getAndroidOutputPath({ flavor, platforms });
  const iosOutputPath = getIOSOutputPath({ platforms });
  const htmlTemplatePath = getHtmlTemplatePath({ html, platforms });

  if (androidOutputPath != null) {
    await writeAndroidAssets({ androidOutputPath, props, extras });

    const manifestXmlPath = path.resolve(
      androidOutputPath,
      "..",
      "AndroidManifest.xml",
    );

    if (hfs.exists(manifestXmlPath)) {
      const manifestXml = readXmlLike(manifestXmlPath);
      const activities = manifestXml.root.querySelectorAll("activity");

      for (const activity of activities) {
        if (activity.getAttribute("android:name") === ".MainActivity") {
          activity.setAttribute("android:theme", "@style/BootTheme");
        }
      }

      await writeXmlLike(manifestXmlPath, manifestXml.root.toString(), {
        ...manifestXml.formatOptions,
        formatter: "prettier",
        htmlWhitespaceSensitivity: "ignore",
        selfClosingTags: true,
        singleAttributePerLine: true,
      });
    } else {
      log.warn("No AndroidManifest.xml found");
    }

    const valuesPath = path.resolve(androidOutputPath, "values");
    hfs.ensureDir(valuesPath);

    const colorsXmlPath = path.resolve(valuesPath, "colors.xml");
    const colorsXmlEntry = `<color name="bootsplash_background">${background.hex}</color>`;

    if (hfs.exists(colorsXmlPath)) {
      const colorsXml = readXmlLike(colorsXmlPath);
      const nextColor = parseHtml(colorsXmlEntry);

      const prevColor = colorsXml.root.querySelector(
        'color[name="bootsplash_background"]',
      );

      if (prevColor != null) {
        prevColor.replaceWith(nextColor);
      } else {
        colorsXml.root.querySelector("resources")?.appendChild(nextColor);
      }

      await writeXmlLike(colorsXmlPath, colorsXml.root.toString(), {
        ...colorsXml.formatOptions,
        formatter: "xmlFormatter",
      });
    } else {
      await writeXmlLike(
        colorsXmlPath,
        `<resources>${colorsXmlEntry}</resources>`,
        { formatter: "xmlFormatter" },
      );
    }

    const stylesXmlPath = path.resolve(valuesPath, "styles.xml");

    if (hfs.exists(stylesXmlPath)) {
      const stylesXml = readXmlLike(stylesXmlPath);
      const prevStyle = stylesXml.root.querySelector('style[name="BootTheme"]');
      const parent = prevStyle?.getAttribute("parent") ?? "Theme.BootSplash";

      const extraItems = parseHtml(
        prevStyle?.text
          .split("\n")
          .map((line) => line.trim())
          .join("") ?? "",
      )
        .childNodes.filter((node) => {
          if (!(node instanceof HTMLElement)) {
            return true;
          }

          const name = node.getAttribute("name");

          return (
            name !== "bootSplashBackground" &&
            name !== "bootSplashLogo" &&
            name !== "bootSplashBrand" &&
            name !== "postBootSplashTheme"
          );
        })
        .map((node) => node.toString());

      const styleItems: string[] = [
        ...(extraItems.length > 0 ? [...extraItems, ""] : []),

        '<item name="bootSplashBackground">@color/bootsplash_background</item>',
        '<item name="bootSplashLogo">@drawable/bootsplash_logo</item>',

        ...(brand != null
          ? ['<item name="bootSplashBrand">@drawable/bootsplash_brand</item>']
          : []),

        '<item name="postBootSplashTheme">@style/AppTheme</item>',
      ];

      const nextStyle = parseHtml(dedent`
        <style name="BootTheme" parent="${parent}">
          ${styleItems.join("\n")}
        </style>
      `);

      prevStyle?.remove(); // remove the existing style
      stylesXml.root.querySelector("resources")?.appendChild(nextStyle);

      await writeXmlLike(stylesXmlPath, stylesXml.root.toString(), {
        ...stylesXml.formatOptions,
        formatter: "prettier",
        htmlWhitespaceSensitivity: "ignore",
      });
    } else {
      log.warn("No styles.xml found");
    }
  }

  if (iosOutputPath != null) {
    await writeIOSAssets({ iosOutputPath, props, extras });

    const infoPlistPath = getInfoPlistPath({ iosOutputPath, plist });

    if (infoPlistPath != null) {
      const infoPlist = ExpoPlist.parse(hfs.text(infoPlistPath)) as Record<
        string,
        unknown
      >;

      infoPlist["UILaunchStoryboardName"] = "BootSplash";

      const formatted = formatXml(ExpoPlist.build(infoPlist), {
        collapseContent: true,
        forceSelfClosingEmptyTag: false,
        indentation: "\t",
        lineSeparator: "\n",
        whiteSpaceAtEndOfSelfclosingTag: false,
      })
        .replace(/<string\/>/gm, "<string></string>")
        .replace(/^\t/gm, "");

      hfs.write(infoPlistPath, formatted);
      log.write(infoPlistPath);
    }

    const pbxprojectPath = Expo.IOSConfig.Paths.getPBXProjectPath(projectRoot);

    const xcodeProjectPath =
      Expo.IOSConfig.Paths.getXcodeProjectPath(projectRoot);

    const project = Expo.IOSConfig.XcodeUtils.getPbxproj(projectRoot);
    const projectName = path.basename(iosOutputPath);
    const groupName = path.parse(xcodeProjectPath).name;

    Expo.IOSConfig.XcodeUtils.addResourceFileToGroup({
      project,
      filepath: path.join(projectName, "BootSplash.storyboard"),
      groupName,
      isBuildFile: true,
    });

    Expo.IOSConfig.XcodeUtils.addResourceFileToGroup({
      project,
      filepath: path.join(projectName, "Colors.xcassets"),
      groupName,
      isBuildFile: true,
    });

    hfs.write(pbxprojectPath, project.writeSync());
    log.write(pbxprojectPath);
  }

  if (htmlTemplatePath != null) {
    await writeWebAssets({ htmlTemplatePath, props, extras });
  }

  await writeGenericAssets({ props, extras });

  if (licenseKey != null && executeAddon) {
    const addon = requireAddon();

    await addon?.execute({
      props,
      extras,

      androidOutputPath,
      iosOutputPath,
      htmlTemplatePath,
    });
  } else {
    console.log(`
${pc.blue("┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓")}
${pc.blue("┃")}  🔑  ${pc.bold(
      "Get a license key for brand image / dark mode support",
    )}  ${pc.blue("┃")}
${pc.blue("┃")}      ${pc.underline(
      "https://zoontek.gumroad.com/l/bootsplash-generator",
    )}     ${pc.blue("┃")}
${pc.blue("┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛")}`);
  }

  console.log(
    `\n💖  Thanks for using ${pc.underline("react-native-bootsplash")}`,
  );
};

// Expo plugin

const withoutExpoSplashScreen: Expo.ConfigPlugin<Props> =
  Expo.createRunOncePlugin((config) => config, "expo-splash-screen", "skip");

const withAndroidAssets: Expo.ConfigPlugin<Props> = (config, props) =>
  Expo.withDangerousMod(config, [
    "android",
    async (config) => {
      const { platformProjectRoot } = config.modRequest;
      const extras = await getExtras(props);

      const androidOutputPath = path.resolve(
        platformProjectRoot,
        "app",
        "src",
        "main",
        "res",
      );

      await writeAndroidAssets({ androidOutputPath, props, extras });
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
      anchor: /super\.onCreate\(null\)/,
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

const withAndroidStyles: Expo.ConfigPlugin<Props> = (config, props) =>
  Expo.withAndroidStyles(config, (config) => {
    const { android, brand } = props;
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

const withAndroidColors: Expo.ConfigPlugin<Props> = (config, props) =>
  Expo.withAndroidColors(config, (config) => {
    const { background } = props;

    config.modResults = assignColorValue(config.modResults, {
      name: "bootsplash_background",
      value: background.hex,
    });

    return config;
  });

const withIOSAssets: Expo.ConfigPlugin<Props> = (config, props) =>
  Expo.withDangerousMod(config, [
    "ios",
    async (config) => {
      const { platformProjectRoot, projectName = "" } = config.modRequest;
      const extras = await getExtras(props);
      const iosOutputPath = path.resolve(platformProjectRoot, projectName);

      await writeIOSAssets({ iosOutputPath, props, extras });
      return config;
    },
  ]);

const withAppDelegate: Expo.ConfigPlugin<Props> = (config) =>
  Expo.withAppDelegate(config, (config) => {
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

const withWebAssets: Expo.ConfigPlugin<Props> = (config, props) =>
  Expo.withDangerousMod(config, [
    config.platforms?.includes("ios") ? "ios" : "android",
    async (config) => {
      const extras = await getExtras(props);
      const fileName = "public/index.html";
      const htmlTemplatePath = path.resolve(workingPath, fileName);

      if (!hfs.exists(htmlTemplatePath)) {
        await exec(`npx expo customize ${fileName}`);
      }

      await writeWebAssets({ htmlTemplatePath, props, extras });
      return config;
    },
  ]);

const withGenericAssets: Expo.ConfigPlugin<Props> = (config, props) =>
  Expo.withDangerousMod(config, [
    config.platforms?.includes("ios") ? "ios" : "android",
    async (config) => {
      const extras = await getExtras(props);
      await writeGenericAssets({ props, extras });
      return config;
    },
  ]);

export const withBootSplash = Expo.createRunOncePlugin<
  | {
      logo: string;
      background?: string;
      logoWidth?: number;
      assetsOutput?: string;

      licenseKey?: string;
      brand?: string;
      brandWidth?: number;
      darkBackground?: string;
      darkLogo?: string;
      darkBrand?: string;

      android?: {
        darkContentBarsStyle?: boolean;
      };
    }
  | undefined
>((config, baseProps) => {
  const { platforms = [], sdkVersion = "0.1.0" } = config;

  isExpo = true;

  if (semver.lt(sdkVersion, "53.0.0")) {
    log.error("Requires Expo 53.0.0 (or higher)");
    process.exit(1);
  }

  if (!baseProps?.logo) {
    log.error("Missing required parameter 'logo'");
    process.exit(1);
  }

  const props = getProps({
    assetsOutput: "assets/bootsplash",
    background: "#fff",
    brandWidth: 80,
    logoWidth: 100,
    ...baseProps,
  });

  const { executeAddon } = props;
  const addon = executeAddon ? requireAddon() : undefined;

  const plugins: Expo.ConfigPlugin<Props>[] = [
    withoutExpoSplashScreen,
    addon?.withGenericAssets ?? withGenericAssets,
  ];

  if (platforms.includes("android")) {
    plugins.push(
      addon?.withAndroidAssets ?? withAndroidAssets,
      withAndroidManifest,
      withMainActivity,
      withAndroidStyles,
      withAndroidColors,
    );

    if (addon != null) {
      plugins.push(addon.withAndroidColorsNight);
    }
  }

  if (platforms.includes("ios")) {
    plugins.push(
      addon?.withIOSAssets ?? withIOSAssets,
      withAppDelegate,
      withInfoPlist,
      withXcodeProject,
    );
  }

  if (platforms.includes("web")) {
    plugins.push(addon?.withWebAssets ?? withWebAssets);
  }

  return Expo.withPlugins(
    config,
    plugins.map((plugin) => [plugin, props]),
  );
}, PACKAGE_NAME);
