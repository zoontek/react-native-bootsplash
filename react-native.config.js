const path = require("path");
const { generate } = require("./dist/commonjs/generate");

module.exports = {
  commands: [
    {
      name: "generate-bootsplash <logoPath>",
      description: "Generate a launch screen using an original logo file",
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

        if (logoWidth > 288) {
          console.log(
            "❌  Logo width can't be superior to 288dp as it will be cropped on Android. Exiting…\n",
          );

          process.exit(1);
        } else if (logoWidth > 192) {
          console.log(
            "⚠️   As logo width is superior to 192dp, it might be cropped on Android.\n",
          );
        }

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
