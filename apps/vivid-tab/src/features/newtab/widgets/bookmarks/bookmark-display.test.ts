import { afterEach, describe, expect, test } from "@test/jest";
import {
	getBookmarkFaviconSources,
	getBookmarkInitials,
} from "./bookmark-display";

const originalChrome = Object.getOwnPropertyDescriptor(globalThis, "chrome");

afterEach(() => {
	if (originalChrome) {
		Object.defineProperty(globalThis, "chrome", originalChrome);
	} else {
		Reflect.deleteProperty(globalThis, "chrome");
	}
});

describe("bookmark display", () => {
	test("creates at most two readable initials", () => {
		expect(getBookmarkInitials("Vivid Tab")).toBe("VT");
		expect(getBookmarkInitials("  one   two three ")).toBe("OT");
		expect(getBookmarkInitials("123 !@#")).toBe("");
		expect(getBookmarkInitials("éclair café")).toBe("CC");
	});

	test("uses Chromium's cached page favicon at a crisp display size", () => {
		Object.defineProperty(globalThis, "chrome", {
			configurable: true,
			value: {
				runtime: {
					getURL: (path: string) => `chrome-extension://vivid${path}`,
				},
			},
		});

		const [source] = getBookmarkFaviconSources(
			"https://example.com/path?q=1#section",
			"chrome",
		);
		const faviconUrl = new URL(source as string);

		expect(faviconUrl.href).toEqual(
			expect.stringMatching(/^chrome-extension:\/\/vivid\/_favicon\/\?/),
		);
		expect(faviconUrl.pathname).toBe("/_favicon/");
		expect(faviconUrl.searchParams.get("pageUrl")).toBe(
			"https://example.com/path?q=1#section",
		);
		expect(faviconUrl.searchParams.get("size")).toBe("64");
	});

	test("uses privacy-safe site icon candidates on Firefox", () => {
		expect(
			getBookmarkFaviconSources("https://example.com/path?q=1", "firefox"),
		).toEqual([
			"https://example.com/apple-touch-icon.png",
			"https://example.com/favicon.ico",
		]);
		expect(
			getBookmarkFaviconSources("http://localhost:3000/page", "firefox"),
		).toEqual([
			"http://localhost:3000/apple-touch-icon.png",
			"http://localhost:3000/favicon.ico",
		]);
	});

	test.each([
		"javascript:alert(1)",
		"chrome://extensions",
		"file:///tmp/report.pdf",
		"not a url",
	])("does not create favicon sources for %s", (url) => {
		expect(getBookmarkFaviconSources(url, "firefox")).toEqual([]);
	});
});
