import { existsSync, readFileSync } from "node:fs";
import { browser } from "@wdio/globals";
import { E2E_HEADLESS, resolveBinary } from "./support/environment";
import {
	FIREFOX_EXTENSION_ARCHIVE,
	FIREFOX_EXTENSION_UUID,
} from "./support/paths";
import { prepareBrowserWindow, sharedConfig } from "./wdio.shared.conf";

if (!existsSync(FIREFOX_EXTENSION_ARCHIVE)) {
	throw new Error(
		`Firefox extension archive not found at ${FIREFOX_EXTENSION_ARCHIVE}. Run bun run build:f and plasmo package first.`,
	);
}

const firefoxBinary = resolveBinary("E2E_FIREFOX_BINARY", "/usr/bin/firefox");

export const config: WebdriverIO.Config = {
	...sharedConfig,
	specs: ["./tests/**/*.ff.test.ts"],
	capabilities: [
		{
			browserName: "firefox",
			acceptInsecureCerts: true,
			"moz:firefoxOptions": {
				...(firefoxBinary ? { binary: firefoxBinary } : {}),
				args: E2E_HEADLESS ? ["-headless"] : [],
				prefs: {
					"browser.shell.checkDefaultBrowser": false,
					"browser.startup.page": 0,
					"datareporting.policy.dataSubmissionEnabled": false,
					"extensions.webextensions.uuids": JSON.stringify({
						"vividtab@jrtilak.dev": FIREFOX_EXTENSION_UUID,
					}),
				},
			},
		},
	],
	before: async () => {
		await prepareBrowserWindow();

		const extension = readFileSync(FIREFOX_EXTENSION_ARCHIVE).toString(
			"base64",
		);
		await browser.installAddOn(extension, true);
	},
};
