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
		"scripts/*.ts",
		"e2e/wdio.*.conf.ts",
		"e2e/tests/*.test.ts",
	],
	/* CSS `npm:` font URLs are resolved by Plasmo but are invisible to Knip. */
	ignoreDependencies: [
		"@fontsource-variable/bricolage-grotesque",
		"@fontsource-variable/outfit",
		/* Plasmo's `raw:` asset scheme is an import prefix, not a package. */
		"raw",
		/* Retained intentionally for feature-level animation work. */
		"motion",
		/* WebdriverIO resolves these names from runner configuration at runtime. */
		"@wdio/cli",
		"@wdio/local-runner",
		"@wdio/mocha-framework",
		"@wdio/spec-reporter",
	],
	ignoreIssues: {
		"src/components/ui/**": ["exports"],
	},
	ignoreBinaries: ["tailwindcss"],
};

export default config;
