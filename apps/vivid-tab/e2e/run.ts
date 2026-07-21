import { existsSync } from "node:fs";
import { readBooleanEnvironment } from "./support/environment";
import {
	APP_ROOT,
	CHROMIUM_EXTENSION_PATH,
	FIREFOX_EXTENSION_ARCHIVE,
} from "./support/paths";

type E2EBrowser = "chromium" | "firefox";

const requestedBrowser = process.argv[2] ?? "all";
const supportedBrowsers = new Set(["all", "chromium", "firefox"]);

if (!supportedBrowsers.has(requestedBrowser)) {
	throw new Error(
		`Unknown E2E browser "${requestedBrowser}". Use all, chromium, or firefox.`,
	);
}

const browsers: E2EBrowser[] =
	requestedBrowser === "all"
		? ["chromium", "firefox"]
		: [requestedBrowser as E2EBrowser];
const skipBuild = readBooleanEnvironment("E2E_SKIP_BUILD", false);

const run = async (command: string[], label: string) => {
	console.log(`\n[e2e] ${label}`);
	const processHandle = Bun.spawn(command, {
		cwd: APP_ROOT,
		env: {
			...process.env,
			PLASMO_PUBLIC_DEV_RADIUS: "",
			PLASMO_PUBLIC_DEV_THEME: "",
			PLASMO_PUBLIC_DEV_VISUAL_EFFECT: "",
		},
		stderr: "inherit",
		stdout: "inherit",
	});
	const exitCode = await processHandle.exited;

	if (exitCode !== 0) {
		throw new Error(`${label} failed with exit code ${exitCode}`);
	}
};

const buildBrowser = async (browserName: E2EBrowser) => {
	if (skipBuild) {
		const artifact =
			browserName === "chromium"
				? CHROMIUM_EXTENSION_PATH
				: FIREFOX_EXTENSION_ARCHIVE;
		if (!existsSync(artifact)) {
			throw new Error(
				`E2E_SKIP_BUILD is enabled, but the required artifact is missing: ${artifact}`,
			);
		}
		return;
	}

	if (browserName === "chromium") {
		await run(["bun", "run", "build"], "Building the Chromium extension");
		return;
	}

	await run(["bun", "run", "build:f"], "Building the Firefox extension");
	await run(
		["bunx", "--no-install", "plasmo", "package", "--target=firefox-mv3"],
		"Packaging the Firefox extension",
	);
};

for (const browserName of browsers) {
	await buildBrowser(browserName);
	await run(
		[
			"bunx",
			"--no-install",
			"wdio",
			"run",
			browserName === "chromium"
				? "./e2e/wdio.c.conf.ts"
				: "./e2e/wdio.ff.conf.ts",
		],
		`Running ${browserName} E2E tests`,
	);
}
