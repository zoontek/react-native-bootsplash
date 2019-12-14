#!/usr/bin/env node

"use strict";

const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const jimp = require("jimp");
const meow = require("meow");

const iconName = "bootsplash_logo";

const logError = text => {
  console.log("❌  " + chalk.red.bold(text));
  process.exit(1);
};

const log = text => {
  console.log(chalk.dim(text));
};

const cli = meow(
  `${chalk.bold("Usage")}
  ${chalk.dim("$")} generate-bootsplash-assets ${chalk.green("<file>")}

${chalk.bold("Options")}
  --project-path  ${chalk.dim("Your React Native project path")}
  --assets-path   ${chalk.dim("Your static assets folder path")}

${chalk.bold("Example")}
  ${chalk.dim(
    "$",
  )} generate-bootsplash-assets my_awesome_logo.png --project-path="." --assets-path="./assets"`,
  {
    pkg: {},
    flags: {
      projectPath: { type: "string" },
      assetsPath: { type: "string" },
    },
  },
);

const defaultProjectPath = path.resolve(path.join(__dirname, "..", "..", ".."));

let { projectPath = defaultProjectPath } = cli.flags;
let [iconPath] = cli.input;
let { assetsPath = path.join(projectPath, "assets") } = cli.flags;

if (!iconPath) {
  logError(
    "No icon file path provided!\r\nType `generate-bootsplash-assets --help` for usage informations.",
  );
}

if (!fs.existsSync(iconPath)) {
  logError(`Invalid icon path. The file ${iconPath} could not be found.`);
}
if (!fs.existsSync(projectPath)) {
  logError(
    `Invalid project path. The directory ${projectPath} could not be found.`,
  );
}

projectPath = path.resolve(projectPath);
iconPath = path.resolve(iconPath);
assetsPath = path.resolve(assetsPath);

const appJsonPath = path.join(projectPath, "app.json");

if (!fs.existsSync(appJsonPath)) {
  logError(
    `Invalid React Native project. The expected ${appJsonPath} file could not be found.`,
  );
}

let projectName;

try {
  projectName = JSON.parse(fs.readFileSync(appJsonPath, "utf-8")).name;
  console.log(projectName);

  if (!projectName) {
    throw new Error("Invalid project name");
  }
} catch (e) {
  logError(
    `Invalid React Native project. ${appJsonPath} does not define a valid project name.`,
  );
}

const imageMap = [];

if (fs.existsSync(assetsPath)) {
  imageMap.push(
    [path.join(assetsPath, iconName + ".png"), [100, 100]],
    [path.join(assetsPath, iconName + "@1,5x.png"), [150, 150]],
    [path.join(assetsPath, iconName + "@2x.png"), [200, 200]],
    [path.join(assetsPath, iconName + "@3x.png"), [300, 300]],
    [path.join(assetsPath, iconName + "@4x.png"), [400, 400]],
  );
} else {
  log(`No ${assetsPath} directory found. Skipping static assets generation…`);
}

const androidResPath = path.join(projectPath, "android", "src", "main", "res");

if (fs.existsSync(androidResPath)) {
  const fileName = iconName + ".png";

  imageMap.push(
    [path.join(androidResPath, "mipmap-mdpi", fileName), [100, 100]],
    [path.join(androidResPath, "mipmap-hdpi", fileName), [150, 150]],
    [path.join(androidResPath, "mipmap-xhdpi", fileName), [200, 200]],
    [path.join(androidResPath, "mipmap-xxhdpi", fileName), [300, 300]],
    [path.join(androidResPath, "mipmap-xxxhdpi", fileName), [400, 400]],
  );
} else {
  log(`No ${androidResPath} directory found. Skipping android generation…`);
}

const iosImagesPath = path.join(
  projectPath,
  "ios",
  projectName,
  "Images.xcassets",
);

if (fs.existsSync(iosImagesPath)) {
  const iosImageSetPath = path.join(iosImagesPath, "BootSplashLogo.imageset");

  if (!fs.existsSync(iosImageSetPath)) {
    fs.mkdirSync(iosImageSetPath);
  }

  imageMap.push(
    [path.join(iosImageSetPath, iconName + ".png"), [100, 100]],
    [path.join(iosImageSetPath, iconName + "@2x.png"), [200, 200]],
    [path.join(iosImageSetPath, iconName + "@3x.png"), [300, 300]],
  );
} else {
  log(`No ${iosImagesPath} directory found. Skipping iOS generation…`);
}

console.log("👍  Looks good! Preparing images…");

jimp
  .read(iconPath)
  .then(image =>
    Promise.all(
      imageMap.map(([path, [width, height]]) =>
        image
          .clone()
          .cover(width, height)
          .write(path),
      ),
    ),
  )
  .then(() => {
    imageMap.map(([path, [width, height]]) => {
      log(`✨ ${path} (${width} x ${height})`);
    });
  })
  .then(() => console.log("✅  Done!"))
  .catch(e => logError(e.toString()));
