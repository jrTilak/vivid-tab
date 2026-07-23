/** @type {import("jest").Config} */
module.exports = {
	collectCoverageFrom: [
		"src/lib/**/*.ts",
		"src/**/use-*.ts",
		"!src/**/*.test.ts",
		"!src/lib/cn.ts",
	],
	coverageThreshold: {
		"src/**/use-*.ts": {
			branches: 100,
			functions: 100,
			lines: 100,
			statements: 100,
		},
		"src/lib/": {
			branches: 100,
			functions: 100,
			lines: 100,
			statements: 100,
		},
	},
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/$1",
		"^@test/jest$": "<rootDir>/test/jest.ts",
		"^raw:/assets/(.*)$": "<rootDir>/assets/$1",
	},
	rootDir: __dirname,
	roots: ["<rootDir>/src", "<rootDir>/scripts"],
	setupFiles: ["<rootDir>/test/setup.ts"],
	testEnvironment: "<rootDir>/test/jest-environment.cjs",
	testEnvironmentOptions: {
		pretendToBeVisual: true,
		url: "https://vivid-tab.test/",
	},
	testMatch: ["**/*.test.ts", "**/*.test.tsx"],
	transform: {
		"^.+\\.(?:jpe?g|png|svg)$": "<rootDir>/test/asset-transformer.cjs",
		"^.+\\.tsx?$": [
			"babel-jest",
			{
				babelrc: false,
				configFile: false,
				presets: [
					["@babel/preset-env", { targets: { node: "current" } }],
					["@babel/preset-react", { runtime: "automatic" }],
					["@babel/preset-typescript", { allExtensions: true, isTSX: true }],
				],
			},
		],
	},
};
