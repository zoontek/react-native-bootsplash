const path = require("path");

module.exports = {
  root: true,
  ignorePatterns: [
    "app.plugin.js",
    ".eslintrc.js",
    "cli.js",
    "react-native.config.js",
    "dist",
    "example",
  ],

  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "react-hooks"],

  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
  ],

  parserOptions: {
    project: path.join(__dirname, "tsconfig.json"),
  },

  env: {
    es2022: true,
  },

  rules: {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",

    "@typescript-eslint/ban-ts-comment": [
      "error",
      { "ts-check": true, "ts-expect-error": false },
    ],
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", ignoreRestSiblings: true },
    ],

    "@typescript-eslint/no-base-to-string": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-non-null-assertion": "error",
    "@typescript-eslint/no-unnecessary-boolean-literal-compare": "error",
    "@typescript-eslint/no-unnecessary-condition": "error",
    "@typescript-eslint/no-unnecessary-qualifier": "error",
    "@typescript-eslint/no-unnecessary-type-arguments": "error",
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/prefer-optional-chain": "error",
    "@typescript-eslint/strict-boolean-expressions": "error",
  },
};
