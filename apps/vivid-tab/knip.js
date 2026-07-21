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
	],
	/* CSS `npm:` font URLs are resolved by Plasmo but are invisible to Knip. */
	ignoreDependencies: [
		"@fontsource-variable/bricolage-grotesque",
		"@fontsource-variable/spline-sans",
	],
	ignoreIssues: {
		"src/components/ui/**": ["exports"],
	},
	ignoreBinaries: ["tailwindcss"],
};

export default config;
