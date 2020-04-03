#!/usr/bin/env node

"use strict";

const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const prompts = require("prompts");
const { generate, addToProject } = require("../lib/generate");
let projectName;

const logoFileName = "bootsplash_logo";

const initialProjectPath = path.join(
  ".",
  path.relative(
    process.cwd(),
    path.resolve(path.join(__dirname, "..", "..", "..")),
  ),
);
const log = (text, dim = false) => {
  console.log(dim ? chalk.dim(text) : text);
};

const isValidHexadecimal = (value) => /^#?([0-9A-F]{3}){1,2}$/i.test(value);

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

const questions = [
  {
    name: "projectPath",
    type: "text",
    initial: initialProjectPath,
    message: "The path to the root of your React Native project",

    validate: (value) => {
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
    initial: (prev) => path.join(prev, "assets"),
    message: "The path to your static assets directory",

    validate: (value) => {
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
    initial: (prev) => path.join(prev, `${logoFileName}_original.png`),

    validate: (value) => {
      if (!fs.existsSync(value)) {
        return `Invalid icon file path. The file ${chalk.bold(
          value,
        )} could not be found.`;
      }

      return true;
    },
  },
  {
    name: "backgroundColor",
    type: "text",
    message: "The bootsplash background color (in hexadecimal)",
    initial: "#FFF",

    validate: (value) => {
      if (!isValidHexadecimal(value)) {
        return "Invalid hexadecimal color.";
      }
      return true;
    },
  },
  {
    name: "iconWidth",
    type: "number",
    message: "The desired icon width (in dp - we recommand approximately ~100)",
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

prompts(questions)
  .then(generate)
  .then(async (path) => {
    const { add } = await prompts([
      {
        name: "add",
        type: "confirm",
        message:
          "Assets created. Update your ios project to use the new launch storyboard?",
        default: true,
      },
    ]);
    if (add && path) {
      return addToProject(path);
    }
  })
  .catch((error) => log(chalk.red.bold(error.toString())));
