import { describe, expect, test } from "bun:test";
import {
	buildSearchSuggestionsUrl,
	parseSearchSuggestions,
} from "./search-suggestions";

describe("search suggestions", () => {
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
});
