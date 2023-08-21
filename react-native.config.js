/** @type {import("@react-native-community/cli-types").Command} */
const generateBootSplash = {
  name: "generate-bootsplash <logo>",
  description: "Generate a launch screen using a logo file path (PNG or SVG)",
  options: [
    {
      name: "--platforms <list>",
      description: "Platforms to generate for, separated by a comma",
      default: "android,ios,web",
      parse: (value) =>
        value
          .toLowerCase()
          .split(/[ ,;|]/)
          .map((platform) => platform.trim())
          .filter((platform) => platform !== ""),
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
      parse: (value) => parseInt(value, 10),
    },
    {
      name: "--assets-output <string>",
      description: "Assets output directory path",
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
      default: "index.html",
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
      parse: (value) => parseInt(value, 10),
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
  func: (argv, ctx, args) => {
    const { generate } = require("./dist/commonjs/generate");

    generate(argv, ctx, args).catch((error) => {
      console.error(error);
      process.exit(1);
    });
  },
};

module.exports = {
  commands: [generateBootSplash],
};
