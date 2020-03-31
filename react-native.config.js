const { generate, addToProject } = require("./lib/generate");
const { spawnSync } = require("child_process");
const { join } = require("path");
const { existsSync, mkdirSync } = require("fs");
module.exports = {
  commands: [
    {
      name: "init-bootsplash",
      description: "Initialize bootsplash with arguments or interactively",
      options: [
        {
          name: "--assetsPath <path>",
          description: "Path for storing assets",
          default: "./assets",
        },
        {
          name: "--iconPath [path]",
          description:
            "Path to icon to build the bootsplash screen around (leave blank for interactive)",
          default: "",
        },
        {
          name: "--backgroundColor <color>",
          description: "Background color to wrap around the icon",
          default: "#fff",
        },
        {
          name: "--iconWidth <width>",
          default: 100,
          parse: arg => parseInt(arg),
          description: "Width of the icon in background image",
        },
      ],
      func: async (
        _,
        __,
        { assetsPath, iconPath, backgroundColor, iconWidth },
      ) => {
        if (!iconPath) {
          spawnSync("node", [join(__dirname, "scripts", "generate.js")], {
            stdio: "inherit",
          });
        } else {
          if (!existsSync(assetsPath)) mkdirSync(assetsPath);
          const out = await generate({
            projectPath: ".",
            assetsPath,
            iconPath,
            backgroundColor,
            iconWidth: iconWidth,
            confirmation: true,
          });
          addToProject();
        }
      },
    },
  ],
};
