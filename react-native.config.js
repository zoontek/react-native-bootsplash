const validProjectTypes = ["detect", "bare", "expo"];
const validPlatforms = ["android", "ios", "web"];

/** @type {import("@react-native-community/cli-types").Command} */
const generateBootSplash = {
  name: "generate-bootsplash <logo>",
  description: "Generate a launch screen using a logo file path (PNG or SVG)",
  options: [
    {
      name: "--project-type <string>",
      description: 'Project type ("detect", "bare" or "expo")',
      default: "detect",
      parse: (projectType) =>
        validProjectTypes.includes(projectType.toLowerCase())
          ? projectType.toLowerCase()
          : "detect",
    },
    {
      name: "--platforms <list>",
      description: "Platforms to generate for, separated by a comma",
      default: validPlatforms.join(","),
      parse: (platforms) => [
        ...new Set(
          platforms
            .toLowerCase()
            .split(/[ ,;|]/)
            .map((platform) => platform.trim())
            .filter((item) => validPlatforms.includes(item)),
        ),
      ],
    },
    {
      name: "--background <string>",
      description: "Background color (in hexadecimal format)",
      default: "#fff",
    },
    {
      name: "--logo-width <number>",
      description:
        "Logo width at @1x (in dp - we recommend approximately ~100)",
      default: 100,
      parse: (logoWidth) => Number.parseInt(logoWidth, 10),
    },
    {
      name: "--assets-output <string>",
      description: "Assets output directory path",
      default: "assets/bootsplash",
    },
    {
      name: "--flavor <string>",
      description:
        "Android flavor build variant (where your resource directory is)",
      default: "main",
    },
    {
      name: "--html <string>",
      description: "HTML template file path (your web app entry point)",
      default: "public/index.html",
    },
    {
      name: "--license-key <string>",
      description:
        "License key to enable brand and dark mode assets generation",
    },
    {
      name: "--brand <string>",
      description: "Brand file path (PNG or SVG)",
    },
    {
      name: "--brand-width <number>",
      description:
        "Brand width at @1x (in dp - we recommend approximately ~80)",
      default: 80,
      parse: (brandWidth) => Number.parseInt(brandWidth, 10),
    },
    {
      name: "--dark-background <string>",
      description: "[dark mode] Background color (in hexadecimal format)",
    },
    {
      name: "--dark-logo <string>",
      description: "[dark mode] Logo file path (PNG or SVG)",
    },
    {
      name: "--dark-brand <string>",
      description: "[dark mode] Brand file path (PNG or SVG)",
    },
  ],
  func: ([logo], _config, args) => {
    const { generate } = require("./dist/commonjs/generate");

    generate({ logo, ...args }).catch((error) => {
      console.error(error);
      process.exit(1);
    });
  },
};

module.exports = {
  commands: [generateBootSplash],
};
