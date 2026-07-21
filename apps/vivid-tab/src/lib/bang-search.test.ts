import { describe, expect, test } from "@test/jest";
import { BANGS, type LocalBang } from "@/data/bangs";
import {
	findBang,
	parseBangQuery,
	resolveBangSearch,
	resolveBangUrl,
} from "./bang-search";

const makeBang = (overrides: Partial<LocalBang> = {}): LocalBang => ({
	domain: "example.com",
	name: "Example",
	template: "https://example.com/search?q={{{s}}}",
	triggers: ["example"],
	...overrides,
});

describe("local bang catalog", () => {
	test("keeps a compact, valid, collision-free subset", () => {
		expect(BANGS.length).toBeGreaterThanOrEqual(50);
		expect(BANGS.length).toBeLessThanOrEqual(100);

		const triggers = BANGS.flatMap((bang) => bang.triggers);
		expect(new Set(triggers).size).toBe(triggers.length);

		for (const bang of BANGS) {
			expect(bang.name.trim()).toBe(bang.name);
			expect(bang.domain).toBe(bang.domain.toLowerCase());
			expect(bang.template).toContain("{{{s}}}");
			expect(["http:", "https:"]).toContain(new URL(bang.template).protocol);
			expect(bang.triggers.length).toBeGreaterThan(0);
			for (const trigger of bang.triggers) {
				expect(trigger).toMatch(/^[a-z0-9._-]+$/);
				expect(trigger).toBe(trigger.toLowerCase());
			}
			if (bang.icon) expect(bang.icon).toMatch(/^assets\/[a-z0-9._-]+$/i);
		}
	});

	test("includes the expected YouTube bang and packaged icon", () => {
		expect(findBang("yt")).toMatchObject({
			domain: "www.youtube.com",
			icon: "assets/youtube.png",
			name: "YouTube",
		});
		expect(findBang("youtube")).toBe(findBang("yt"));
	});
});

describe("findBang", () => {
	test.each([
		"yt",
		"YT",
		" !YouTube ",
	])("normalizes canonical triggers and aliases: %s", (trigger) => {
		expect(findBang(trigger)?.name).toBe("YouTube");
	});

	test("returns undefined for unsupported or malformed triggers", () => {
		expect(findBang("missing")).toBeUndefined();
		expect(findBang("!!yt")).toBeUndefined();
	});
});

describe("parseBangQuery", () => {
	test.each([
		["!yt kittens", "kittens", "yt"],
		["  !YT   lo-fi   music  ", "lo-fi music", "yt"],
		["!docs.rs serde", "serde", "docs.rs"],
		["!dev.to\nreact server components", "react server components", "dev.to"],
	])("parses a leading bang in %j", (rawQuery, query, trigger) => {
		expect(parseBangQuery(rawQuery)).toEqual({
			position: "leading",
			query,
			trigger,
		});
	});

	test.each([
		["kittens !yt", "kittens", "yt"],
		["  lo-fi\tmusic !YT  ", "lo-fi music", "yt"],
		["serde !docs.rs", "serde", "docs.rs"],
	])("parses a trailing bang in %j", (rawQuery, query, trigger) => {
		expect(parseBangQuery(rawQuery)).toEqual({
			position: "trailing",
			query,
			trigger,
		});
	});

	test("parses a bare bang as a leading bang with an empty query", () => {
		expect(parseBangQuery("!yt")).toEqual({
			position: "leading",
			query: "",
			trigger: "yt",
		});
	});

	test.each([
		undefined,
		null,
		42,
		{},
		"",
		" \n\t ",
		"regular search",
		"query with !yt inside text",
		"!yt query !g",
		"!!yt query",
		"! yt query",
		"query !yt!",
		"query !yt,",
		"!c++ query",
	])("returns null for non-bang or malformed input: %j", (rawQuery) => {
		expect(parseBangQuery(rawQuery)).toBeNull();
	});
});

describe("resolveBangUrl", () => {
	test("encodes reserved and Unicode characters with plus-separated spaces", () => {
		expect(resolveBangUrl(makeBang(), "café cats/dogs? yes")).toBe(
			"https://example.com/search?q=caf%C3%A9+cats%2Fdogs%3F+yes",
		);
	});

	test("supports percent-encoded spaces without converting them to plus", () => {
		expect(
			resolveBangUrl(
				makeBang({ format: ["url_encode_placeholder"] }),
				"two words",
			),
		).toBe("https://example.com/search?q=two%20words");
	});

	test("respects a format that intentionally disables placeholder encoding", () => {
		expect(resolveBangUrl(makeBang({ format: [] }), "two words/one")).toBe(
			"https://example.com/search?q=two words/one",
		);
	});

	test("replaces every placeholder in a template", () => {
		expect(
			resolveBangUrl(
				makeBang({
					template: "https://example.com/{{{s}}}?copy={{{s}}}",
				}),
				"one two",
			),
		).toBe("https://example.com/one+two?copy=one+two");
	});

	test("opens a snap domain for an empty query when configured", () => {
		expect(
			resolveBangUrl(
				makeBang({
					format: ["open_snap_domain"],
					snapDomain: "news.example.com",
				}),
				"",
			),
		).toBe("https://news.example.com/");
	});

	test("opens the template origin for an empty query by default", () => {
		expect(resolveBangUrl(makeBang(), "")).toBe("https://example.com/");
		expect(
			resolveBangUrl(
				makeBang({ format: ["open_base_path"], snapDomain: "snap.example" }),
				"",
			),
		).toBe("https://example.com/");
	});

	test("uses the empty placeholder when no open behavior is configured", () => {
		expect(resolveBangUrl(makeBang({ format: [] }), "")).toBe(
			"https://example.com/search?q=",
		);
	});

	test("safely replaces malformed UTF-16 without changing valid pairs", () => {
		expect(resolveBangUrl(makeBang(), "\ud800")).toContain("%EF%BF%BD");
		expect(resolveBangUrl(makeBang(), "😀")).toContain("%F0%9F%98%80");
	});
});

describe("resolveBangSearch", () => {
	test("resolves leading and trailing aliases to the same local destination", () => {
		const leading = resolveBangSearch("!youtube ambient music");
		const trailing = resolveBangSearch("ambient music !YT");

		expect(leading).toMatchObject({
			kind: "bang",
			position: "leading",
			query: "ambient music",
			trigger: "youtube",
			url: "https://www.youtube.com/results?search_query=ambient+music",
		});
		expect(trailing).toMatchObject({
			kind: "bang",
			position: "trailing",
			query: "ambient music",
			trigger: "yt",
			url: "https://www.youtube.com/results?search_query=ambient+music",
		});
	});

	test("preserves unknown and malformed bang text for browser search", () => {
		expect(resolveBangSearch("  !unknown kittens  ")).toEqual({
			kind: "search",
			query: "!unknown kittens",
		});
		expect(resolveBangSearch("!yt kittens !g")).toEqual({
			kind: "search",
			query: "!yt kittens !g",
		});
	});

	test("falls back safely for untrusted non-string values", () => {
		expect(resolveBangSearch(undefined)).toEqual({ kind: "search", query: "" });
		expect(resolveBangSearch({ query: "!yt cats" })).toEqual({
			kind: "search",
			query: "",
		});
	});

	test("opens a supported bare bang without a search query", () => {
		const resolution = resolveBangSearch("!yt");

		expect(resolution).toMatchObject({
			kind: "bang",
			query: "",
			url: "https://www.youtube.com/",
		});
	});
});
