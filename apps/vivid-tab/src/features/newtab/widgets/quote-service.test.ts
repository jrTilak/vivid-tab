import { describe, expect, test } from "bun:test";
import {
	buildQuoteUrl,
	isCachedQuoteFresh,
	parseCachedQuote,
	parseQuote,
} from "./quote-service";

describe("quote service", () => {
	test("validates cached quote data", () => {
		const quote = { _id: "one", author: "Author", content: "Quote" };

		expect(parseQuote(JSON.stringify(quote))).toEqual(quote);
		expect(parseQuote("not-json")).toBeNull();
		expect(parseQuote({ content: "Missing fields" })).toBeNull();
	});

	test("supports legacy cache entries and expires timestamped entries", () => {
		const quote = { _id: "one", author: "Author", content: "Quote" };
		const legacy = parseCachedQuote(JSON.stringify(quote));
		const current = parseCachedQuote(
			JSON.stringify({ ...quote, fetchedAt: 1_000 }),
		);

		expect(legacy).toEqual({ quote });
		expect(legacy && isCachedQuoteFresh(legacy, "science", 1_001)).toBe(false);
		expect(current && isCachedQuoteFresh(current, "science", 2_000)).toBe(
			false,
		);
	});

	test("uses a fresh quote only for the same category selection", () => {
		const cached = parseCachedQuote(
			JSON.stringify({
				_id: "one",
				author: "Author",
				categoriesKey: "science",
				content: "Quote",
				fetchedAt: 1_000,
			}),
		);

		expect(cached && isCachedQuoteFresh(cached, "science", 2_000)).toBe(true);
		expect(cached && isCachedQuoteFresh(cached, "history", 2_000)).toBe(false);
		expect(cached && isCachedQuoteFresh(cached, "science", 3_700_001)).toBe(
			false,
		);
	});

	test("encodes categories in the request URL", () => {
		const url = new URL(buildQuoteUrl(["science", "self help"]));

		expect(url.searchParams.get("tags")).toBe("science|self help");
		expect(url.searchParams.get("maxLength")).toBe("80");
	});
});
