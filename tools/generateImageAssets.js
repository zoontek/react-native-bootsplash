#!/usr/bin/env node
const { argv } = require("yargs");
const { resolve, sep } = require("path");
const { existsSync, readFileSync, writeFileSync } = require("fs");
const { read } = require("jimp");
const chalk = require("chalk");

const {
  projectDir: unsafeProjectDir,
  icon: unsafeIcon,
  iconName: unsafeIconName,
  assetsPath: unsafeAssetsPath,
} = argv;

console.log(
  chalk.yellow(
    "Please make sure you have created a backup of your project before continuing! (Ctrl+C to exit)\n",
  ),
);

if (typeof unsafeProjectDir !== "string") {
  throw new Error(
    `❌ Expected string --projectDir, encountered ${unsafeProjectDir}.`,
  );
} else if (typeof unsafeIcon !== "string") {
  throw new Error(`❌ Expected string --icon, encountered ${unsafeIcon}.`);
}

// TODO: Could check for ignore case etc.
const iconName =
  // XXX: Defaults to the name used in the example project.
  typeof unsafeIconName === "string" && unsafeIconName.length > 0
    ? unsafeIconName
    : "react_logo";

const assetsPath =
  typeof unsafeAssetsPath === "string" && unsafeAssetsPath.length > 0
    ? unsafeAssetsPath
    : `assets`;

const projectDir = resolve(unsafeProjectDir);
const icon = resolve(unsafeIcon);

const appJsonDir = `${projectDir}${sep}app.json`;
const projectAssetsPath = resolve(`${projectDir}${sep}${assetsPath}`);

// TODO: warn the user to commit before going ahead

if (!existsSync(projectDir)) {
  throw new Error(`❌ The directory "${projectDir}" could not be found.`);
} else if (!existsSync(icon)) {
  throw new Error(`❌ The icon "${icon}" could not be found.`);
} else if (!existsSync(appJsonDir)) {
  throw new Error(
    `❌ The specified projectDir does not look like a React Native project. Expected ${appJsonDir}, but it does not exist.`,
  );
}

const { name: projectName } = JSON.parse(readFileSync(appJsonDir));

if (typeof projectName !== "string" || projectName.length <= 0) {
  throw new Error(`❌ ${appJsonDir} does not define a valid project name.`);
}

// TODO: Should be able to define a custom asset name.
const iosAssetsDir = `${projectDir}${sep}ios${sep}${projectName}${sep}Images.xcassets${sep}ReactLogo.imageset`;

if (!existsSync(iosAssetsDir)) {
  throw new Error(
    `❌ Failed to resolve the Images.xcassets directory for the ReactLogo.imageset.`,
  );
}

// TODO: Should be able to dynamically generate this too.
const Contents = {
  images: [
    {
      idiom: "universal",
      filename: `${iconName}.png`,
      scale: "1x",
    },
    {
      idiom: "universal",
      filename: `${iconName}@2x.png`,
      scale: "2x",
    },
    {
      idiom: "universal",
      filename: `${iconName}@3x.png`,
      scale: "3x",
    },
  ],
  info: {
    version: 1,
    author: "xcode",
  },
};

const imageMap = [
  /* assets */
  [`${projectAssetsPath}${sep}${iconName}.png`, [100, 100]],
  [`${projectAssetsPath}${sep}${iconName}@1,5x.png`, [150, 150]],
  [`${projectAssetsPath}${sep}${iconName}@2x.png`, [200, 200]],
  [`${projectAssetsPath}${sep}${iconName}@3x.png`, [300, 300]],
  [`${projectAssetsPath}${sep}${iconName}@4x.png`, [400, 400]],
  /* android */
  [
    `${projectDir}${sep}android${sep}app${sep}src${sep}main${sep}res${sep}mipmap-hdpi${sep}${iconName}.png`,
    [150, 150],
  ],
  [
    `${projectDir}${sep}android${sep}app${sep}src${sep}main${sep}res${sep}mipmap-mdpi${sep}${iconName}.png`,
    [100, 100],
  ],
  [
    `${projectDir}${sep}android${sep}app${sep}src${sep}main${sep}res${sep}mipmap-xhdpi${sep}${iconName}.png`,
    [200, 200],
  ],
  [
    `${projectDir}${sep}android${sep}app${sep}src${sep}main${sep}res${sep}mipmap-xxhdpi${sep}${iconName}.png`,
    [300, 300],
  ],
  [
    `${projectDir}${sep}android${sep}app${sep}src${sep}main${sep}res${sep}mipmap-xxxhdpi${sep}${iconName}.png`,
    [400, 400],
  ],
  /* ios */
  [`${iosAssetsDir}${sep}${iconName}.png`, [100, 100]],
  [`${iosAssetsDir}${sep}${iconName}@2x.png`, [200, 200]],
  [`${iosAssetsDir}${sep}${iconName}@3x.png`, [300, 300]],
];

console.log("👍 Looks good! Preparing images...\n");

read(icon)
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
  .then(() =>
    imageMap.map(([path, [width, height]]) =>
      console.log(chalk.green(`✨ ${path} (${width}x${height})`)),
    ),
  )
  .then(() => console.log("\nDone! Thanks for using react-native-bootsplash."))
  .catch(e => console.log(chalk.red(`❌ ${e.toString()}`)));
