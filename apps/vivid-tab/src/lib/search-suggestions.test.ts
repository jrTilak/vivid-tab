import { describe, expect, test } from "@test/jest";
import {
	buildSearchSuggestionsUrl,
	parseSearchSuggestions,
	supportsRemoteSearchSuggestions,
} from "./search-suggestions";

describe("search suggestions", () => {
	test("supports remote suggestions outside Firefox only", () => {
		expect(supportsRemoteSearchSuggestions("chrome")).toBe(true);
		expect(supportsRemoteSearchSuggestions(undefined)).toBe(true);
		expect(supportsRemoteSearchSuggestions("firefox")).toBe(false);
	});

	test("encodes the query through URLSearchParams", () => {
		const url = new URL(buildSearchSuggestionsUrl("cats & dogs/नेपाल"));

		expect(url.searchParams.get("client")).toBe("firefox");
		expect(url.searchParams.get("q")).toBe("cats & dogs/नेपाल");
	});

	test("accepts only string suggestions from the provider tuple", () => {
		expect(
			parseSearchSuggestions(["query", ["one", 2, null, " two ", "", "one"]]),
		).toEqual(["one", "two"]);
		expect(parseSearchSuggestions({ suggestions: ["invalid shape"] })).toEqual(
			[],
		);
	});

	test("deduplicates and limits provider results to ten suggestions", () => {
		const suggestions = Array.from(
			{ length: 12 },
			(_, index) => `item-${index}`,
		);

		expect(
			parseSearchSuggestions(["query", [...suggestions, "item-0"]]),
		).toEqual(suggestions.slice(0, 10));
		expect(parseSearchSuggestions(null)).toEqual([]);
		expect(parseSearchSuggestions(["query", null])).toEqual([]);
	});
});
