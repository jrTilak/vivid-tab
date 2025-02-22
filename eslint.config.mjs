import js from "@eslint/js"
import tseslintParser from "@typescript-eslint/parser"
import eslintConfigPrettier from "eslint-config-prettier"
import pluginReact from "eslint-plugin-react"
import pluginReactHooks from "eslint-plugin-react-hooks"
import unicorn from "eslint-plugin-unicorn"
import unusedImports from "eslint-plugin-unused-imports"
import globals from "globals"
import tseslint from "typescript-eslint"

/**
 * @type {import("eslint").Linter.Config}
 * */
const config = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  pluginReact.configs.flat.recommended,
  // General Settings (for TypeScript and parser options)
  {
    languageOptions: {
      parser: tseslintParser,
      parserOptions: {
        sourceType: "module",
        ecmaVersion: "latest",
      },
    },
  },
  {
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
      },
    },
  },
  {
    plugins: {
      "react-hooks": pluginReactHooks,
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      // React scope no longer necessary with new JSX transform.
      "react/react-in-jsx-scope": "off",
    },
  },
  // Unicorn Plugin Rules
  {
    plugins: {
      unicorn,
    },
    rules: {
      "unicorn/filename-case": [
        "error",
        { case: "kebabCase", ignore: ["README.md"] },
      ],
    },
  },
  // Unused Imports Plugin Rules
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      "unused-imports/no-unused-imports": "error",
    },
  },
  // Spacing and formatting rules
  {
    rules: {
      indent: ["error", 2], // 2-space indentation
      "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 1, maxBOF: 0 }], // Limit empty lines
      "space-in-parens": ["error", "never"], // No spaces inside parentheses
      "array-bracket-spacing": ["error", "never"], // No spaces inside array brackets
      "object-curly-spacing": ["error", "always"], // Spaces inside object literals
      "key-spacing": ["error", { beforeColon: false, afterColon: true }], // Space after colon in objects
      "comma-spacing": ["error", { before: false, after: true }], // Space after commas
      "newline-before-return": "error", // Enforce newline before return
      "padding-line-between-statements": [
        "error",
        {
          blankLine: "always",
          prev: "*",
          next: "block",
        },
        {
          blankLine: "always",
          prev: "block",
          next: "*",
        },
        {
          blankLine: "always",
          prev: "*",
          next: "block-like",
        },
        {
          blankLine: "always",
          prev: "block-like",
          next: "*",
        },
      ],
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    ignores: [
      "build/**",
      "tailwind.config.js",
      "node_modules/**",
      "postcss.config.js",
      ".plasmo/**",
    ],
  },
]

export default config
