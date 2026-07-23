import { describe, expect, test } from "@test/jest";
import { getBundledAssetUrl, POPULAR_APP_ASSETS } from "./assets";

describe("bundled assets", () => {
	test.each([
		["assets/claude.png", "claude.png"],
		["assets/drive.png", "drive.png"],
		["assets/gmail.png", "gmail.png"],
		["assets/linkedin.png", "linkedin.png"],
		["assets/openai.png", "openai.png"],
		["assets/x.png", "x.png"],
		["assets/youtube.png", "youtube.png"],
	])("resolves the generated path %s", (path, filename) => {
		expect(getBundledAssetUrl(path)).toContain(filename);
	});

	test("does not invent URLs for missing or empty paths", () => {
		expect(getBundledAssetUrl("assets/unknown.png")).toBeUndefined();
		expect(getBundledAssetUrl("")).toBeUndefined();
		expect(getBundledAssetUrl(undefined)).toBeUndefined();
	});

	test("exposes every popular app icon as a packaged URL", () => {
		expect(Object.values(POPULAR_APP_ASSETS)).toHaveLength(8);
		expect(Object.values(POPULAR_APP_ASSETS).every(Boolean)).toBe(true);
	});
});
