#!/usr/bin/env node

const { Command } = require("commander");

const program = new Command();
const pkg = require("./package.json");

const validPlatforms = ["android", "ios", "web"];

program
  .name(pkg.name)
  .description(pkg.description)
  .version(pkg.version)
  .command("generate", { isDefault: true })
  .description("Generate a launch screen using a logo file path (PNG or SVG)")
  .argument("<logo>", "Logo file path (PNG or SVG)")
  .option(
    "--platforms <list>",
    "Platforms to generate for, separated by a comma",
    validPlatforms.join(","),
  )
  .option(
    "--background <string>",
    "Background color (in hexadecimal format)",
    "#fff",
  )
  .option(
    "--logo-width <number>",
    "Logo width at @1x (in dp - we recommend approximately ~100)",
    100,
  )
  .option(
    "--assets-output <string>",
    "Assets output directory path",
    "assets/bootsplash",
  )
  .option(
    "--flavor <string>",
    "Android flavor build variant (where your resource directory is)",
    "main",
  )
  .option(
    "--html <string>",
    "HTML template file path (your web app entry point)",
    "public/index.html",
  )
  .option("--plist <string>", "Custom Info.plist file path")
  .option(
    "--license-key <string>",
    "License key to enable brand and dark mode assets generation",
  )
  .option("--brand <string>", "Brand file path (PNG or SVG)")
  .option(
    "--brand-width <number>",
    "Brand width at @1x (in dp - we recommend approximately ~80)",
    80,
  )
  .option(
    "--dark-background <string>",
    "[dark mode] Background color (in hexadecimal format)",
  )
  .option("--dark-logo <string>", "[dark mode] Logo file path (PNG or SVG)")
  .option("--dark-brand <string>", "[dark mode] Brand file path (PNG or SVG)")
  .action((logo, options) => {
    const { platforms, logoWidth, brandWidth, ...rest } = options;

    const args = {
      ...rest,

      platforms: [
        ...new Set(
          platforms
            .toLowerCase()
            .split(/[ ,;|]/)
            .map((platform) => platform.trim())
            .filter((item) => validPlatforms.includes(item)),
        ),
      ],

      logoWidth: Number.parseInt(logoWidth, 10),
      brandWidth: Number.parseInt(brandWidth, 10),
    };

    const { generate } = require("./dist/commonjs/generate");

    generate({ logo, ...args }).catch((error) => {
      console.error(error);
      process.exit(1);
    });
  });

program.parse(process.argv);
