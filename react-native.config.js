const path = require("path");
const { generate } = require("./dist/commonjs/generate");

module.exports = {
  commands: [
    {
      name: "generate-bootsplash <logoPath>",
      description:
        "Generate a launch screen using an original logo file (PNG or SVG)",
      options: [
        {
          name: "--background-color <color>",
          description:
            "color used as launch screen background (in hexadecimal format)",
          default: "#fff",
        },
        {
          name: "--logo-width <width>",
          description:
            "logo width at @1x (in dp - we recommend approximately ~100)",
          default: 100,
          parse: (value) => parseInt(value, 10),
        },
        {
          name: "--assets-path [path]",
          description:
            "path to your static assets directory (useful to require the logo file in JS)",
        },
        {
          name: "--flavor <flavor>",
          description:
            '[android only] flavor build variant (outputs in an android resource directory other than "main")',
          default: "main",
        },
      ],
      func: (
        [logoPath],
        { project: { android, ios } },
        { backgroundColor, logoWidth, assetsPath, flavor },
      ) => {
        const workingPath =
          process.env.INIT_CWD || process.env.PWD || process.cwd();

        return generate({
          android,

          ios: ios
            ? {
                ...ios,
                // Fix to support previous CLI versions
                projectPath: (ios.xcodeProject
                  ? path.resolve(ios.sourceDir, ios.xcodeProject.name)
                  : ios.projectPath
                ).replace(/\.(xcodeproj|xcworkspace)$/, ""),
              }
            : null,

          workingPath,
          logoPath: path.resolve(workingPath, logoPath),
          assetsPath: assetsPath
            ? path.resolve(workingPath, assetsPath)
            : undefined,

          backgroundColor,
          flavor,
          logoWidth,
        }).catch((error) => {
          console.error(error);
        });
      },
    },
  ],
};
