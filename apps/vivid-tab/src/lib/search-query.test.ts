import { describe, expect, test } from "@test/jest";
import { resolveSearchTarget } from "./search-query";

describe("resolveSearchTarget", () => {
	test.each([
		["https://example.com/path?q=1", "https://example.com/path?q=1"],
		["http://localhost:3000", "http://localhost:3000"],
		["chrome://extensions", "chrome://extensions"],
	])("keeps explicit URLs: %s", (query, expected) => {
		expect(resolveSearchTarget(query)).toEqual({
			kind: "url",
			url: expected,
		});
	});

	test.each([
		["example.com", "https://example.com/"],
		["example.com/docs?q=hello", "https://example.com/docs?q=hello"],
		["sub.example.co.uk", "https://sub.example.co.uk/"],
	])("normalizes host-like input: %s", (query, expected) => {
		expect(resolveSearchTarget(query)).toEqual({
			kind: "url",
			url: expected,
		});
	});

	test("trims input before resolving it", () => {
		expect(resolveSearchTarget("  example.com  ")).toEqual({
			kind: "url",
			url: "https://example.com/",
		});
		expect(resolveSearchTarget("  search terms  ")).toEqual({
			kind: "search",
			query: "search terms",
		});
	});

	test.each([
		"",
		"localhost",
		"two words.com",
		".com",
		"example..com",
		"javascript:alert(1)",
		"data:text/html,<h1>unsafe</h1>",
	])("uses search for non-URL input: %j", (query) => {
		expect(resolveSearchTarget(query)).toEqual({ kind: "search", query });
	});

	test("handles untrusted non-string messages without throwing", () => {
		expect(resolveSearchTarget(undefined)).toEqual({
			kind: "search",
			query: "",
		});
		expect(resolveSearchTarget({ query: "example.com" })).toEqual({
			kind: "search",
			query: "",
		});
	});
});
