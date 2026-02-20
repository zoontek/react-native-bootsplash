import * as Expo from "@expo/config-plugins";
import ExpoPlist from "@expo/plist";
import glob from "fast-glob";
import findUp from "find-up";
import fs from "fs";
import { HTMLElement, parse as parseHtml } from "node-html-parser";
import path from "path";
import pc from "picocolors";
import { dedent } from "ts-dedent";
import formatXml from "xml-formatter";
import {
  hfs,
  log,
  readXmlLike,
  requireAddon,
  setLoggerMode,
  transformProps,
  writeAndroidAssets,
  writeGenericAssets,
  writeIOSAssets,
  writeWebAssets,
  writeXmlLike,
} from "./utils";

const cwd = process.env.INIT_CWD ?? process.env.PWD ?? process.cwd();
const packagePath = findUp.sync("package.json", { cwd });

if (!packagePath) {
  log.error("We couldn't find a package.json in your project.");
  process.exit(1);
}

setLoggerMode({ type: "cli", cwd });

const projectRoot = path.dirname(packagePath);

const getAndroidOutputPath = ({ flavor }: { flavor: string }) => {
  const sourceDir = path.join(projectRoot, "android");

  if (!fs.existsSync(sourceDir)) {
    return;
  }

  const appDir = path.join(sourceDir, "app");

  const androidOutputPath = path.resolve(
    sourceDir,
    fs.existsSync(appDir) ? "app" : "",
    "src",
    flavor,
    "res",
  );

  if (hfs.exists(androidOutputPath)) {
    return androidOutputPath;
  }

  log.warn(
    `No ${path.relative(
      cwd,
      androidOutputPath,
    )} directory found. Skipping Android assets generation…`,
  );
};

const getIOSOutputPath = () => {
  const podfile = glob
    .sync("**/Podfile", {
      cwd: projectRoot.replace(/^([a-zA-Z]+:|\.\/)/, ""),
      deep: 10,
      ignore: ["**/@(Pods|node_modules|Carthage|vendor|android)/**"],
    })
    .find((project) => {
      return path.dirname(project) === "ios";
    });

  if (!podfile) {
    return;
  }

  const sourceDir = path.dirname(path.join(projectRoot, podfile));

  const xcodeProjectName = fs
    .readdirSync(sourceDir)
    .sort()
    .reverse()
    .find((fileName) => {
      const ext = path.extname(fileName);
      return ext === ".xcodeproj" || ext === ".xcworkspace";
    });

  if (xcodeProjectName == null) {
    log.warn("No Xcode project found. Skipping iOS assets generation…");
    return;
  }

  const iosOutputPath = path
    .resolve(sourceDir, xcodeProjectName)
    .replace(/\.(xcodeproj|xcworkspace)$/, "");

  if (hfs.exists(iosOutputPath)) {
    return iosOutputPath;
  }

  log.warn(
    `No ${path.relative(
      cwd,
      iosOutputPath,
    )} directory found. Skipping iOS assets generation…`,
  );
};

const getHtmlTemplatePath = ({ html }: { html: string }) => {
  const htmlTemplatePath = path.resolve(cwd, html);

  if (hfs.exists(htmlTemplatePath)) {
    return htmlTemplatePath;
  }

  log.warn(
    `No ${path.relative(
      cwd,
      htmlTemplatePath,
    )} found. Skipping HTML + CSS generation…`,
  );
};

const getInfoPlistPath = ({
  iosOutputPath,
  plist,
}: {
  iosOutputPath: string;
  plist: string | undefined;
}) => {
  if (plist != null) {
    const infoPlistPath = path.resolve(cwd, plist);

    if (!hfs.exists(infoPlistPath)) {
      return log.warn(`No ${path.relative(cwd, infoPlistPath)} found`);
    }

    return infoPlistPath;
  }

  return path.resolve(iosOutputPath, "Info.plist");
};

export const generate = async ({
  platforms,
  html,
  flavor,
  plist,
  ...rawProps
}: {
  platforms: Array<"android" | "ios" | "web">;
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
  const props = await transformProps(cwd, rawProps);
  const addon = requireAddon(props);

  const { background, brand } = props;

  const androidOutputPath = platforms.includes("android")
    ? getAndroidOutputPath({ flavor })
    : undefined;

  const iosOutputPath = platforms.includes("ios")
    ? getIOSOutputPath()
    : undefined;

  const htmlTemplatePath = platforms.includes("web")
    ? getHtmlTemplatePath({ html })
    : undefined;

  if (androidOutputPath != null) {
    await writeAndroidAssets({ androidOutputPath, props });

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
    await writeIOSAssets({ iosOutputPath, props });

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
  }

  if (htmlTemplatePath != null) {
    await writeWebAssets({ htmlTemplatePath, props });
  }

  await writeGenericAssets({ props });

  if (addon != null) {
    await addon.execute({
      props,
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
