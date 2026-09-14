import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["react", "typescript"],
  categories: {
    correctness: "error",
    perf: "error",
    suspicious: "error",
  },
  env: {
    builtin: true,
  },
  rules: {
    "no-param-reassign": "error",
    "no-shadow": "off",
    "no-use-before-define": "error",
    "no-var": "error",

    "no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", ignoreRestSiblings: true },
    ],

    "react/button-has-type": "error",
    "react/prefer-function-component": "error",
    "react/react-in-jsx-scope": "off",

    "typescript/no-dynamic-delete": "error",
    "typescript/no-empty-object-type": "error",
    "typescript/no-explicit-any": "error",
    "typescript/no-import-type-side-effects": "error",
    "typescript/no-invalid-void-type": "error",
    "typescript/no-non-null-assertion": "error",
  },
});
