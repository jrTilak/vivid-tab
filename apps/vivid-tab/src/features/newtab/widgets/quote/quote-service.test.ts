import { describe, expect, test } from "@test/jest";
import { QUOTE_CATEGORIES, QUOTES } from "@/data/quotes";
import { selectQuote } from "./quote-service";

describe("local quote catalog", () => {
	test("stays small and contains valid categorized quotes", () => {
		const supportedCategories = new Set(
			QUOTE_CATEGORIES.map((category) => category.slug),
		);

		expect(QUOTE_CATEGORIES).toHaveLength(8);
		expect(QUOTES.length).toBeGreaterThan(0);
		expect(QUOTES.length).toBeLessThanOrEqual(48);
		expect(new Set(QUOTES.map((quote) => quote._id)).size).toBe(QUOTES.length);

		for (const category of QUOTE_CATEGORIES) {
			expect(category.name.trim()).toBe(category.name);
			expect(category.slug.trim()).toBe(category.slug);
			expect(
				QUOTES.some((quote) =>
					quote.categories.some(
						(quoteCategory) => quoteCategory === category.slug,
					),
				),
			).toBe(true);
		}

		for (const quote of QUOTES) {
			expect(quote.author.trim()).toBe(quote.author);
			expect(quote.content.trim()).toBe(quote.content);
			expect(quote.author).not.toBe("");
			expect(quote.content).not.toBe("");
			expect(quote.content.length).toBeLessThanOrEqual(80);
			expect(quote.categories.length).toBeGreaterThan(0);
			expect(
				quote.categories.every((category) => supportedCategories.has(category)),
			).toBe(true);
		}
	});

	test("selects across the full catalog at both random boundaries", () => {
		expect(selectQuote([], () => 0)._id).toBe(QUOTES[0]?._id);
		expect(selectQuote([], () => 0.999_999)._id).toBe(QUOTES.at(-1)?._id);
	});

	test("selects from one supported category", () => {
		const category = QUOTE_CATEGORIES[0];
		if (!category) throw new Error("Expected a quote category");
		const eligible = QUOTES.filter((quote) =>
			quote.categories.some((quoteCategory) => quoteCategory === category.slug),
		);

		expect(selectQuote([category.slug], () => 0)._id).toBe(eligible[0]?._id);
		expect(selectQuote([category.slug], () => 0.999_999)._id).toBe(
			eligible.at(-1)?._id,
		);
	});

	test("combines supported categories with OR semantics", () => {
		const categories = QUOTE_CATEGORIES.slice(0, 2).map(
			(category) => category.slug,
		);
		const eligible = QUOTES.filter((quote) =>
			quote.categories.some((category) => categories.includes(category)),
		);

		expect(selectQuote(categories, () => 0)._id).toBe(eligible[0]?._id);
		expect(selectQuote(categories, () => 0.999_999)._id).toBe(
			eligible.at(-1)?._id,
		);
	});

	test("falls back to all quotes for unsupported persisted categories", () => {
		expect(selectQuote(["removed-category"], () => 0)._id).toBe(QUOTES[0]?._id);
	});

	test("ignores unsupported values when a supported category is selected", () => {
		const category = QUOTE_CATEGORIES[0];
		if (!category) throw new Error("Expected a quote category");
		const expected = QUOTES.find((quote) =>
			quote.categories.some((quoteCategory) => quoteCategory === category.slug),
		);

		expect(selectQuote(["removed-category", category.slug], () => 0)._id).toBe(
			expected?._id,
		);
	});
});
