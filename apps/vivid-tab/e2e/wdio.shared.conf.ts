import { mkdirSync } from "node:fs";
import path from "node:path";
import { browser } from "@wdio/globals";
import type { Options } from "@wdio/types";
import { E2E_TIMEOUT_MS } from "./support/environment";
import { E2E_ARTIFACTS_PATH } from "./support/paths";

const screenshotDirectory = path.join(E2E_ARTIFACTS_PATH, "screenshots");

const safeFilename = (value: string) =>
	value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 100);

export const prepareBrowserWindow = async () => {
	await browser.setWindowSize(1440, 1000);
};

export const sharedConfig: Options.Testrunner = {
	runner: "local",
	framework: "mocha",
	injectGlobals: false,
	maxInstances: 1,
	logLevel: "warn",
	reporters: ["spec"],
	waitforTimeout: E2E_TIMEOUT_MS,
	waitforInterval: 100,
	connectionRetryTimeout: 120_000,
	connectionRetryCount: 2,
	transformRequest: (requestOptions) => {
		/* Node 26's native Undici dispatcher rejects WebdriverIO's explicit value. */
		if (requestOptions.headers instanceof Headers) {
			requestOptions.headers.delete("Content-Length");
		}
		return requestOptions;
	},
	mochaOpts: {
		ui: "bdd",
		timeout: 120_000,
	},
	afterTest: async (test, _context, result) => {
		if (result.passed || result.skipped || test.pending) return;

		try {
			const logs = await browser.getLogs("browser");
			if (logs.length > 0) {
				console.error("[e2e] Browser console:", logs);
			}
		} catch {
			/* Firefox does not expose the Chromium browser-log endpoint. */
		}

		mkdirSync(screenshotDirectory, { recursive: true });
		const browserName = browser.capabilities.browserName ?? "browser";
		const filename = `${safeFilename(browserName)}-${safeFilename(test.title)}.png`;

		await browser.saveScreenshot(path.join(screenshotDirectory, filename));
	},
};
