import { describe, expect, test } from "bun:test";
import { DEFAULT_WALLHAVEN_SEARCH_TERMS } from "@/constants/wallpapers";
import {
	buildWallhavenSearchUrl,
	parseWallhavenResponse,
	resolveWallhavenSearchTerms,
} from "./wallhaven";

describe("Wallhaven requests", () => {
	test("uses the safe defaults when no useful keywords are configured", () => {
		expect(resolveWallhavenSearchTerms([])).toEqual([
			...DEFAULT_WALLHAVEN_SEARCH_TERMS,
		]);
		expect(resolveWallhavenSearchTerms([" ", ""])).toEqual([
			...DEFAULT_WALLHAVEN_SEARCH_TERMS,
		]);
	});

	test("normalizes configured keywords", () => {
		expect(resolveWallhavenSearchTerms([" Space ", "CITY"])).toEqual([
			"space",
			"city",
		]);
	});

	test("builds an encoded SFW-only search URL", () => {
		const url = new URL(
			buildWallhavenSearchUrl({
				page: 3,
				searchTerm: "super hero",
				seed: "123456",
			}),
		);

		expect(url.origin + url.pathname).toBe(
			"https://wallhaven.cc/api/v1/search",
		);
		expect(url.searchParams.get("page")).toBe("3");
		expect(url.searchParams.get("purity")).toBe("100");
		expect(url.searchParams.get("q")).toBe("super hero");
		expect(url.searchParams.get("resolutions")).toBe("1920x1080");
		expect(url.searchParams.get("sorting")).toBe("random");
	});

	test("validates API data and keeps the lightweight gallery thumbnail", () => {
		expect(
			parseWallhavenResponse({
				data: [
					{
						path: "https://w.wallhaven.cc/full/example.jpg",
						thumbs: {
							large: "https://th.wallhaven.cc/lg/example.jpg",
						},
					},
				],
			}),
		).toEqual([
			{
				src: "https://w.wallhaven.cc/full/example.jpg",
				thumbnailSrc: "https://th.wallhaven.cc/lg/example.jpg",
			},
		]);
		expect(parseWallhavenResponse({ data: [{ path: 42 }] })).toEqual([]);
	});
});
