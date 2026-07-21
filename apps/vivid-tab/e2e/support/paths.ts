import path from "node:path";
import { fileURLToPath } from "node:url";

export const APP_ROOT = fileURLToPath(new URL("../../", import.meta.url));
export const E2E_ROOT = path.join(APP_ROOT, "e2e");
export const CHROMIUM_EXTENSION_PATH = path.join(
	APP_ROOT,
	"build/chrome-mv3-prod",
);
export const FIREFOX_EXTENSION_ARCHIVE = path.join(
	APP_ROOT,
	"build/firefox-mv3-prod.zip",
);
/** Makes the temporary add-on origin deterministic in isolated test profiles. */
export const FIREFOX_EXTENSION_UUID = "5a018cf9-b489-4f89-a2fd-9e4b4a63ad5b";
export const FIREFOX_EXTENSION_BASE_URL = `moz-extension://${FIREFOX_EXTENSION_UUID}`;
export const E2E_ARTIFACTS_PATH = path.join(APP_ROOT, ".e2e");
