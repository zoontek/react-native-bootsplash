#!/usr/bin/env node

"use strict";

const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const jimp = require("jimp");
const prompts = require("prompts");

const iconName = "bootsplash_logo";
let projectName;

const absDefaultProjectPath = path.resolve(
  path.join(__dirname, "..", "..", ".."),
);

const defaultProjectPath = path.join(
  ".",
  path.relative(process.cwd(), absDefaultProjectPath),
);

const log = text => {
  console.log(chalk.dim(text));
};

const ContentsJson = `{
  "images": [
    {
      "idiom": "universal",
      "filename": "bootsplash_logo.png",
      "scale": "1x"
    },
    {
      "idiom": "universal",
      "filename": "bootsplash_logo@2x.png",
      "scale": "2x"
    },
    {
      "idiom": "universal",
      "filename": "bootsplash_logo@3x.png",
      "scale": "3x"
    }
  ],
  "info": {
    "version": 1,
    "author": "xcode"
  }
}
`;

const getProjectName = projectPath => {
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

const questions = [
  {
    name: "projectPath",
    type: "text",
    initial: defaultProjectPath,
    message: "The path to the root of your React Native project",

    validate: value => {
      if (!fs.existsSync(value)) {
        return `Invalid project path. The directory ${chalk.bold(
          value,
        )} could not be found.`;
      }

      projectName = getProjectName(value);

      if (!projectName) {
        return `Invalid React Native project. A valid ${chalk.bold(
          "app.json",
        )} file could not be found.`;
      }

      return true;
    },
  },
  {
    name: "assetsPath",
    type: "text",
    initial: prev => path.join(prev, "assets"),
    message: "The path to your static assets directory",

    validate: value => {
      if (!fs.existsSync(value)) {
        return `Invalid assets path. The directory ${chalk.bold(
          value,
        )} could not be found.`;
      }

      return true;
    },
  },
  {
    name: "iconPath",
    type: "text",
    message: "Your original icon file",
    initial: prev => path.join(prev, "bootsplash_logo_original.png"),

    validate: value => {
      if (!fs.existsSync(value)) {
        return `Invalid icon file path. The file ${chalk.bold(
          value,
        )} could not be found.`;
      }

      return true;
    },
  },
  {
    name: "iconWidth",
    type: "number",
    message:
      "The desired icon width (in dp - we recommand approximately ~100)?",
    initial: 100,
    min: 1,
    max: 1000,
  },
  {
    name: "confirmation",
    type: "confirm",
    message:
      "Are you sure? All the existing bootsplash images will be overwritten!",
    initial: true,
  },
];

prompts(questions).then(
  ({ projectPath, assetsPath, iconPath, iconWidth: w1, confirmation }) => {
    if (!projectPath || !assetsPath || !iconPath || !w1 || !confirmation) {
      process.exit(1);
    }

    const imageMap = [];

    jimp
      .read(iconPath)
      .then(image => {
        const h = size =>
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
          const fileName = iconName + ".png";

          imageMap.push(
            [path.join(androidResPath, "mipmap-mdpi", fileName), [w1, h(w1)]],
            [path.join(androidResPath, "mipmap-hdpi", fileName), [w15, h(w15)]],
            [path.join(androidResPath, "mipmap-xhdpi", fileName), [w2, h(w2)]],
            [path.join(androidResPath, "mipmap-xxhdpi", fileName), [w3, h(w3)]],
            [
              path.join(androidResPath, "mipmap-xxxhdpi", fileName),
              [w4, h(w4)],
            ],
          );
        } else {
          log(
            `No ${androidResPath} directory found. Skipping android generation…`,
          );
        }

        const iosImagesPath = path.join(
          projectPath,
          "ios",
          projectName,
          "Images.xcassets",
        );

        if (fs.existsSync(iosImagesPath)) {
          const iosImageSetPath = path.join(
            iosImagesPath,
            "BootSplashLogo.imageset",
          );

          if (!fs.existsSync(iosImageSetPath)) {
            fs.mkdirSync(iosImageSetPath);
          }

          fs.writeFileSync(
            path.join(iosImageSetPath, "Contents.json"),
            ContentsJson,
            "utf-8",
          );

          imageMap.push(
            [path.join(iosImageSetPath, iconName + ".png"), [w1, h(w1)]],
            [path.join(iosImageSetPath, iconName + "@2x.png"), [w2, h(w2)]],
            [path.join(iosImageSetPath, iconName + "@3x.png"), [w3, h(w3)]],
          );
        } else {
          log(`No ${iosImagesPath} directory found. Skipping iOS generation…`);
        }

        imageMap.push(
          [path.join(assetsPath, iconName + ".png"), [w1, h(w1)]],
          [path.join(assetsPath, iconName + "@1,5x.png"), [w15, h(w15)]],
          [path.join(assetsPath, iconName + "@2x.png"), [w2, h(w2)]],
          [path.join(assetsPath, iconName + "@3x.png"), [w3, h(w3)]],
          [path.join(assetsPath, iconName + "@4x.png"), [w4, h(w4)]],
        );

        console.log("👍  Looking good! Generating images…");

        return Promise.all(
          imageMap.map(([path, [width, height]]) =>
            image
              .clone()
              .cover(width, height)
              .write(path),
          ),
        );
      })
      .then(() => {
        imageMap.map(([path, [width, height]]) => {
          log(`✨ ${path} (${width}x${height})`);
        });
      })
      .then(() =>
        console.log(
          `✅  Done! Thanks for using ${chalk.underline(
            "react-native-bootsplash",
          )}.`,
        ),
      )
      .catch(error => {
        console.log(chalk.red.bold(error.toString()));
      });
  },
);
