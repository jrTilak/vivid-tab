/** @type {import('knip').KnipConfig} */
const config = {
  ignoreExportsUsedInFile: {
    interface: true,
    type: true,
  },
  tags: ["-lintignore"],
  entry: [
    "src/newtab.tsx",
    "src/background.ts",
    "src/tabs/*.tsx",
    "src/styles/index.css",
    "eslint.*",
  ],
  ignoreDependencies: ["@types/chrome", "data-base64"],
  ignoreIssues: {
    "src/components/ui/**": ["exports"],
  },
  ignoreBinaries: ["tailwindcss"],
}

export default config
