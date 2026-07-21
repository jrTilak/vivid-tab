import { describe, expect, test } from "@test/jest";
import { getBookmarkFaviconUrl, getBookmarkInitials } from "./bookmark-display";

describe("bookmark display", () => {
	test("creates at most two readable initials", () => {
		expect(getBookmarkInitials("Vivid Tab")).toBe("VT");
		expect(getBookmarkInitials("  one   two three ")).toBe("OT");
		expect(getBookmarkInitials("123 !@#")).toBe("");
		expect(getBookmarkInitials("éclair café")).toBe("CC");
	});

	test("uses only HTTP origins for conventional favicons", () => {
		expect(getBookmarkFaviconUrl("https://example.com/path?q=1")).toBe(
			"https://example.com/favicon.ico",
		);
		expect(getBookmarkFaviconUrl("http://localhost:3000/page")).toBe(
			"http://localhost:3000/favicon.ico",
		);
		expect(getBookmarkFaviconUrl("javascript:alert(1)")).toBeUndefined();
		expect(getBookmarkFaviconUrl("chrome://extensions")).toBeUndefined();
		expect(getBookmarkFaviconUrl("not a url")).toBeUndefined();
	});
});
