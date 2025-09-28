import * as Expo from "@expo/config-plugins";
import plist from "@expo/plist";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { Transformer } from "@napi-rs/image";
import { projectConfig as getAndroidProjectConfig } from "@react-native-community/cli-config-android";
import { getProjectConfig as getAppleProjectConfig } from "@react-native-community/cli-config-apple";
import { findProjectRoot } from "@react-native-community/cli-tools";
import { Resvg } from '@resvg/resvg-js';
import childProcess from "child_process";
import crypto from "crypto";
import detectIndent from "detect-indent";
import fs from "fs-extra";
import { HTMLElement, parse as parseHtml } from "node-html-parser";
import path from "path";
import pc from "picocolors";
import { Options as PrettierOptions } from "prettier";
import * as htmlPlugin from "prettier/plugins/html";
import * as cssPlugin from "prettier/plugins/postcss";
import * as prettier from "prettier/standalone";
import semver from "semver";
import { dedent } from "ts-dedent";
import util from "util";
import formatXml, { XMLFormatterOptions } from "xml-formatter";
import { Manifest } from ".";

const workingPath = process.env.INIT_CWD ?? process.env.PWD ?? process.cwd();
const projectRoot = findProjectRoot(workingPath);

const getIOSProjectConfig = getAppleProjectConfig({ platformName: "ios" });
const ios = getIOSProjectConfig(projectRoot, {});
const android = getAndroidProjectConfig(projectRoot);

type PackageJson = {
  version?: string;
  dependencies?: Record<string, string>;
};

type ProjectType = "detect" | "bare" | "expo";
type Platforms = ("android" | "ios" | "web")[];

type ImageType = Uint8Array | Buffer;

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
    console.log(pc.red(`❌  ${text}`));
  },
  title: (emoji: string, text: string) => {
    console.log(`\n${emoji}  ${pc.underline(pc.bold(text))}`);
  },
  warn: (text: string) => {
    console.log(pc.yellow(`⚠️   ${text}`));
  },
  write: (filePath: string, dimensions?: { width: number; height: number }) => {
    console.log(
      `    ${path.relative(workingPath, filePath)}` +
        (dimensions != null
          ? ` (${dimensions.width}x${dimensions.height})`
          : ""),
    );
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

const getStoryboard = ({
  logoHeight,
  logoWidth,
  background: { R, G, B },
  fileNameSuffix,
}: {
  logoHeight: number;
  logoWidth: number;
  background: Color["rgb"];
  fileNameSuffix: string;
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
                                <rect key="frame" x="${logoX}" y="${logoY}" width="${logoWidth}" height="${logoHeight}"/>
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
        <image name="BootSplashLogo-${fileNameSuffix}" width="${logoWidth}" height="${logoHeight}"/>
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

  copy: (src: string, dest: string) => {
    if (hfs.isDir(src) || !hfs.exists(dest)) {
      return fs.copySync(src, dest, { overwrite: true });
    }

    const srcBuffer = fs.readFileSync(src);
    const destBuffer = fs.readFileSync(dest);

    if (!srcBuffer.equals(destBuffer)) {
      return fs.copySync(src, dest, { overwrite: true });
    }
  },
  ensureDir: (dir: string) => {
    fs.mkdirSync(dir, { recursive: true });
  },
  write: (path: string, content: string) => {
    const trimmed = content.trim();
    fs.writeFileSync(path, trimmed === "" ? trimmed : trimmed + "\n", "utf-8");
  },
};

// Adapted from https://github.com/square/find-yarn-workspace-root
const findUp = <T>(from: string, matcher: (dir: string) => T | undefined) => {
  let previous: string | undefined;
  let current = path.normalize(from);

  do {
    const found = matcher(current);

    if (typeof found !== "undefined") {
      return found;
    }

    previous = current;
    current = path.dirname(current);
  } while (current !== previous);
};

export const getExpoConfig = (from: string): { isExpo: boolean } => {
  const hasDependency =
    findUp(from, (dir) => {
      const pkgPath = path.resolve(dir, "package.json");

      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = hfs.json(pkgPath) as PackageJson;
          return pkg.dependencies?.expo != null;
        } catch {} // eslint-disable-line no-empty
      }
    }) ?? false;

  if (!hasDependency) {
    return { isExpo: false };
  }

  const version = findUp(from, (dir) => {
    const pkgPath = path.resolve(dir, "node_modules", "expo", "package.json");

    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = hfs.json(pkgPath) as PackageJson;
        return pkg.version;
      } catch {} // eslint-disable-line no-empty
    }
  });

  if (version == null || semver.lt(version, "51.0.20")) {
    log.error("Requires Expo 51.0.20 (or higher)");
    process.exit(1);
  }

  return { isExpo: true };
};

export const writeJson = (filePath: string, content: object) => {
  hfs.write(filePath, JSON.stringify(content, null, 2));
  log.write(filePath);
};

type FormatOptions = { indent?: detectIndent.Indent } & (
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

export const cleanIOSAssets = (dir: string) => {
  hfs
    .readDir(dir)
    .filter((file) => file === "Colors.xcassets" || file === "Images.xcassets")
    .map((file) => path.join(dir, file))
    .flatMap((dir) =>
      hfs
        .readDir(dir)
        .filter((file) => file.startsWith("BootSplash"))
        .map((file) => path.join(dir, file)),
    )
    .forEach((file) => {
      hfs.rm(file);
    });
};

const getImageBase64 = async (
  image: ImageType | undefined,
  width: number,
) => {
  if (image == null) {
    return "";
  }
  const buffer = await resizeToPngBuffer(image, width);
  return buffer.toString("base64");
};

const getFileNameSuffix = async ({
  background,
  brand,
  brandWidth,
  darkBackground,
  darkBrand,
  darkLogo,
  logo,
  logoWidth,
}: {
  background: Color;
  brand: ImageType | undefined;
  brandWidth: number;
  darkBackground: Color | undefined;
  darkBrand: ImageType | undefined;
  darkLogo: ImageType | undefined;
  logo: ImageType;
  logoWidth: number;
}) => {
  const [logoHash, darkLogoHash, brandHash, darkBrandHash] = await Promise.all([
    getImageBase64(logo, logoWidth),
    getImageBase64(darkLogo, logoWidth),
    getImageBase64(brand, brandWidth),
    getImageBase64(darkBrand, brandWidth),
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

  return crypto
    .createHash("shake256", { outputLength: 3 })
    .update(stableKey)
    .digest("hex")
    .toLowerCase();
};

const ensureSupportedFormat = async (
  name: string,
  image: ImageType | undefined,
) => {
  if (image == null) {
    return;
  }

  const { format } = await getImageMetadata(image);
  if (format !== "png" && format !== "svg") {
    log.error(`${name} image file format (${format}) is not supported`);
    process.exit(1);
  }
};

const getAndroidOutputPath = ({
  assetsOutputPath,
  brandHeight,
  brandWidth,
  flavor,
  isExpo,
  logoHeight,
  logoWidth,
  platforms,
}: {
  assetsOutputPath: string;
  brandHeight: number;
  brandWidth: number;
  flavor: string;
  isExpo: boolean;
  logoHeight: number;
  logoWidth: number;
  platforms: Platforms;
}) => {
  if (!platforms.includes("android")) {
    return;
  }

  const withSizeChecks = (assetsOutputPath: string) => {
    if (logoWidth > 288 || logoHeight > 288) {
      return log.warn(
        "Logo size exceeding 288x288dp will be cropped by Android. Skipping Android assets generation…",
      );
    }
    if (brandWidth > 200 || brandHeight > 80) {
      return log.warn(
        "Brand size exceeding 200x80dp will be cropped by Android. Skipping Android assets generation…",
      );
    }

    if (logoWidth > 192 || logoHeight > 192) {
      log.warn("Logo size exceeds 192x192dp. It might be cropped by Android.");
    }

    return assetsOutputPath;
  };

  if (isExpo) {
    return withSizeChecks(path.resolve(assetsOutputPath, "android"));
  }
  if (android == null) {
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

  return withSizeChecks(androidOutputPath);
};

const getIOSOutputPath = ({
  assetsOutputPath,
  isExpo,
  platforms,
}: {
  assetsOutputPath: string;
  isExpo: boolean;
  platforms: Platforms;
}) => {
  if (!platforms.includes("ios")) {
    return;
  }
  if (isExpo) {
    return path.resolve(assetsOutputPath, "ios");
  }
  if (ios == null) {
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

const getHtmlTemplatePath = async ({
  isExpo,
  html,
  platforms,
}: {
  isExpo: boolean;
  html: string;
  platforms: Platforms;
}) => {
  if (!platforms.includes("web")) {
    return;
  }

  if (isExpo) {
    const htmlTemplatePath = path.resolve(workingPath, html);

    const htmlTemplateRelativePath = path.relative(
      workingPath,
      htmlTemplatePath,
    );

    if (
      htmlTemplateRelativePath === "public/index.html" &&
      !hfs.exists(htmlTemplatePath)
    ) {
      const cmd = `npx expo customize ${htmlTemplateRelativePath}`;
      console.log(pc.dim(`Running ${cmd}`));
      await exec(cmd);
    }
  }

  const htmlTemplatePath = path.resolve(workingPath, html);

  if (!hfs.exists(htmlTemplatePath)) {
    return log.warn(
      `No ${path.relative(
        workingPath,
        htmlTemplatePath,
      )} file found. Skipping HTML + CSS generation…`,
    );
  }

  return htmlTemplatePath;
};

 async function getImageHeight(
  image: ImageType | undefined,
  width: number,
) {
  if (image == null) {
    return 0;
  }
  const buffer = await resizeToPngBuffer(image, width);
  const metadata = await getImageMetadata(buffer);
  return Math.round(metadata.height || 0);
}

export type AddonConfig = {
  licenseKey: string;
  isExpo: boolean;
  fileNameSuffix: string;

  androidOutputPath: string | void;
  iosOutputPath: string | void;
  htmlTemplatePath: string | void;
  assetsOutputPath: string;

  logoPath: string;
  darkLogoPath: string | undefined;
  brandPath: string | undefined;
  darkBrandPath: string | undefined;

  logoHeight: number;
  logoWidth: number;
  brandHeight: number;
  brandWidth: number;

  background: Color;
  logo: ImageType;
  brand: ImageType | undefined;

  darkBackground: Color | undefined;
  darkLogo: ImageType | undefined;
  darkBrand: ImageType | undefined;
};

const requireAddon = ():
  | { execute: (config: AddonConfig) => Promise<void> }
  | undefined => {
  try {
    return require("./addon"); // eslint-disable-line
  } catch {
    return;
  }
};

const getFileBuffer = (filePath: string) => fs.readFileSync(filePath);

const transformImage = (image: ImageType) => {
  if (isSvg(image)) {
    return Transformer.fromSvg(image, "rgba(255,255,255,0)");
  }
  return new Transformer(image);
}

const isSvg = (image: ImageType) => {
  const decoder = new TextDecoder('utf-8');
  const startOfFile = decoder.decode(image.slice(0, 100));
  return startOfFile.trim().startsWith('<svg');
}

const resizeToPngBuffer = (image: ImageType, width: number) => {
  if (isSvg(image)) {
    const resvg = new Resvg(image as Buffer, { background: 'rgba(255,255,255,0)', fitTo: { mode: "width", value: width } });
    return resvg.render().asPng();
  }
  return transformImage(image).resize({ width }).png();
}

const getImageMetadata = (image: ImageType) => {
  return transformImage(image).metadata(false);
}


export const generate = async ({
  projectType,
  platforms,
  html,
  flavor,
  licenseKey,
  ...args
}: {
  logo: string;
  projectType: ProjectType;
  platforms: Platforms;
  background: string;
  logoWidth: number;
  assetsOutput: string;
  html: string;
  flavor: string;

  licenseKey?: string;
  brand?: string;
  brandWidth: number;
  darkBackground?: string;
  darkLogo?: string;
  darkBrand?: string;
}) => {
  const isExpo =
    projectType === "expo" ||
    (projectType === "detect" && getExpoConfig(workingPath).isExpo);

  if (semver.lt(process.versions.node, "18.0.0")) {
    log.error("Requires Node 18 (or higher)");
    process.exit(1);
  }

  const logoPath = path.resolve(workingPath, args.logo);

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

  const assetsOutputPath = path.resolve(workingPath, args.assetsOutput);

  const logo = getFileBuffer(logoPath);
  const darkLogo =
    darkLogoPath != null ? getFileBuffer(darkLogoPath) : undefined;
  const brand = brandPath != null ? getFileBuffer(brandPath) : undefined;
  const darkBrand =
    darkBrandPath != null ? getFileBuffer(darkBrandPath) : undefined;

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
      "You specified a license key but none of the options that requires it.",
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

  await Promise.all([
    ensureSupportedFormat("Logo", logo),
    ensureSupportedFormat("Dark logo", darkLogo),
    ensureSupportedFormat("Brand", brand),
    ensureSupportedFormat("Dark brand", darkBrand)
  ]);

  const [logoHeight, brandHeight] = await Promise.all([
    getImageHeight(logo, logoWidth),
    getImageHeight(brand, brandWidth)
  ])

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

  const fileNameSuffix = await getFileNameSuffix({
    background,
    brand,
    brandWidth,
    darkBackground,
    darkBrand,
    darkLogo,
    logo,
    logoWidth,
  });

  const androidOutputPath = getAndroidOutputPath({
    assetsOutputPath,
    brandHeight,
    brandWidth,
    flavor,
    isExpo,
    logoHeight,
    logoWidth,
    platforms,
  });

  const iosOutputPath = getIOSOutputPath({
    assetsOutputPath,
    isExpo,
    platforms,
  });

  const htmlTemplatePath = await getHtmlTemplatePath({
    isExpo,
    html,
    platforms,
  });

  if (androidOutputPath != null) {
    log.title("🤖", "Android");

    hfs.ensureDir(androidOutputPath);

    await Promise.all(
      [
        { ratio: 1, suffix: "mdpi" },
        { ratio: 1.5, suffix: "hdpi" },
        { ratio: 2, suffix: "xhdpi" },
        { ratio: 3, suffix: "xxhdpi" },
        { ratio: 4, suffix: "xxxhdpi" },
      ].map(async ({ ratio, suffix }) => {
        const drawableDirPath = path.resolve(
          androidOutputPath,
          `drawable-${suffix}`,
        );

        hfs.ensureDir(drawableDirPath);

        // https://developer.android.com/develop/ui/views/launch/splash-screen#dimensions
        const canvasSize = 288 * ratio;

        const filePath = path.resolve(drawableDirPath, "bootsplash_logo.png");

        const resizedLogo = await resizeToPngBuffer(logo, logoWidth * ratio)
        const logoImg = await loadImage(resizedLogo);

        const centeredLogoX = (canvasSize - logoImg.width) / 2;
        const centeredLogoY = (canvasSize - logoImg.height) / 2;

        const canvas = createCanvas(canvasSize, canvasSize);
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvasSize, canvasSize);
        ctx.drawImage(logoImg, centeredLogoX, centeredLogoY);
        const canvasBuffer = canvas.toBuffer("image/png");

        await fs.writeFile(filePath, canvasBuffer);
        log.write(filePath, { width: canvasSize, height: canvasSize });
      }),
    );

    if (!isExpo) {
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
        log.warn("No AndroidManifest.xml found. Skipping…");
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

        const prevStyle = stylesXml.root.querySelector(
          'style[name="BootTheme"]',
        );

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

          ...(brand != null && brandPath != null
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
        log.warn("No styles.xml found. Skipping…");
      }
    }
  }

  if (iosOutputPath != null) {
    log.title("🍏", "iOS");

    hfs.ensureDir(iosOutputPath);
    cleanIOSAssets(iosOutputPath);

    const storyboardPath = path.resolve(iosOutputPath, "BootSplash.storyboard");

    const colorsSetPath = path.resolve(
      iosOutputPath,
      "Colors.xcassets",
      `BootSplashBackground-${fileNameSuffix}.colorset`,
    );

    const imageSetPath = path.resolve(
      iosOutputPath,
      "Images.xcassets",
      `BootSplashLogo-${fileNameSuffix}.imageset`,
    );

    hfs.ensureDir(colorsSetPath);
    hfs.ensureDir(imageSetPath);

    await writeXmlLike(
      storyboardPath,
      getStoryboard({
        logoHeight,
        logoWidth,
        background: background.rgb,
        fileNameSuffix,
      }),
      {
        formatter: "xmlFormatter",
        whiteSpaceAtEndOfSelfclosingTag: false,
      },
    );

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

    const logoFileName = `logo-${fileNameSuffix}`;

    writeJson(path.resolve(imageSetPath, "Contents.json"), {
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
      ].map(async ({ ratio, suffix }) => {
        const filePath = path.resolve(
          imageSetPath,
          `${logoFileName}${suffix}.png`,
        );
        const buffer = await resizeToPngBuffer(logo, logoWidth * ratio);
        const { width, height } = await getImageMetadata(buffer)
        await fs.writeFile(filePath, buffer);
        log.write(filePath, { width, height });
      }),
    );

    if (!isExpo) {
      const infoPlistPath = path.resolve(iosOutputPath, "Info.plist");

      const infoPlist = plist.parse(hfs.text(infoPlistPath)) as Record<
        string,
        unknown
      >;

      infoPlist["UILaunchStoryboardName"] = "BootSplash";

      const formatted = formatXml(plist.build(infoPlist), {
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

      const pbxprojectPath =
        Expo.IOSConfig.Paths.getPBXProjectPath(projectRoot);

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
  }

  if (htmlTemplatePath != null) {
    log.title("🌐", "Web");

    const htmlTemplate = readXmlLike(htmlTemplatePath);
    const { format } = await getImageMetadata(logo);
    const prevStyle = htmlTemplate.root.querySelector("#bootsplash-style");

    const base64 = (
      format === "svg"
        ? hfs.buffer(logoPath)
        : await resizeToPngBuffer(logo, Math.round(logoWidth * 2))
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
  }

  log.title("📄", "Assets");

  hfs.ensureDir(assetsOutputPath);

  writeJson(path.resolve(assetsOutputPath, "manifest.json"), {
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
    ].map(async ({ ratio, suffix }) => {
      const filePath = path.resolve(assetsOutputPath, `logo${suffix}.png`);

      const buffer = await resizeToPngBuffer(logo, Math.round(logoWidth * ratio));
      const { width, height } = await getImageMetadata(buffer);
      await fs.writeFile(filePath, buffer);
      log.write(filePath, { width, height });
    }),
  );

  if (licenseKey != null && executeAddon) {
    const addon = requireAddon();

    await addon?.execute({
      licenseKey,
      isExpo,
      fileNameSuffix,

      androidOutputPath,
      iosOutputPath,
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
