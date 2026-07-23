import { describe, expect, test } from "@test/jest";
import { THEMES } from "./theme";

describe("theme logic", () => {
	test("exposes only the supported dark palettes", () => {
		expect(THEMES).toEqual(["dark", "catppuccin-mocha", "tokyo-night"]);
	});
});
