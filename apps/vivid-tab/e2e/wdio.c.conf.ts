import { existsSync } from "node:fs";
import { browser } from "@wdio/globals";
import { E2E_HEADLESS, resolveBinary } from "./support/environment";
import { CHROMIUM_EXTENSION_PATH } from "./support/paths";
import { prepareBrowserWindow, sharedConfig } from "./wdio.shared.conf";

if (!existsSync(CHROMIUM_EXTENSION_PATH)) {
	throw new Error(
		`Chromium extension build not found at ${CHROMIUM_EXTENSION_PATH}. Run bun run build first.`,
	);
}

const chromiumBinary = resolveBinary(
	"E2E_CHROMIUM_BINARY",
	"/usr/bin/chromium",
);
const chromedriverBinary = resolveBinary(
	"E2E_CHROMEDRIVER_BINARY",
	"/usr/bin/chromedriver",
);

const chromiumArguments = [
	`--disable-extensions-except=${CHROMIUM_EXTENSION_PATH}`,
	`--load-extension=${CHROMIUM_EXTENSION_PATH}`,
	"--disable-background-networking",
	"--disable-default-apps",
	"--disable-dev-shm-usage",
	"--disable-sync",
	"--no-first-run",
	"--window-size=1440,1000",
	...(E2E_HEADLESS ? ["--headless=new"] : []),
];

const chromiumCapability = {
	browserName: "chrome",
	acceptInsecureCerts: true,
	"goog:loggingPrefs": { browser: "ALL" },
	"goog:chromeOptions": {
		...(chromiumBinary ? { binary: chromiumBinary } : {}),
		args: chromiumArguments,
	},
	...(chromedriverBinary
		? { "wdio:chromedriverOptions": { binary: chromedriverBinary } }
		: {}),
} as WebdriverIO.Capabilities;

export const config: WebdriverIO.Config = {
	...sharedConfig,
	specs: ["./tests/**/*.c.test.ts"],
	capabilities: [chromiumCapability],
	before: async () => {
		await prepareBrowserWindow();

		/* Confirm that the loaded page can execute extension-aware scripts later. */
		await browser.getWindowHandles();
	},
};
