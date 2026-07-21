import { afterEach, describe, expect, test } from "@test/jest";
import { cleanup, renderHook } from "@testing-library/react";
import { QUOTE_CATEGORIES, QUOTES } from "@/data/quotes";
import { useQuote } from "./use-quote";

afterEach(cleanup);

describe("useQuote", () => {
	test("returns a local quote synchronously", () => {
		const { result } = renderHook(() => useQuote([]));

		expect(QUOTES.some((quote) => quote._id === result.current._id)).toBe(true);
	});

	test("returns a quote from the selected category", () => {
		const category = QUOTE_CATEGORIES[0];
		if (!category) throw new Error("Expected a quote category");
		const { result } = renderHook(() => useQuote([category.slug]));
		const selected = QUOTES.find((quote) => quote._id === result.current._id);

		expect(selected?.categories).toContain(category.slug);
	});

	test("keeps the quote when only category order changes", () => {
		const categories = QUOTE_CATEGORIES.slice(0, 2).map(
			(category) => category.slug,
		);
		const { result, rerender } = renderHook(
			({ selected }) => useQuote(selected),
			{ initialProps: { selected: categories } },
		);
		const firstQuote = result.current;

		rerender({ selected: [...categories].reverse() });

		expect(result.current).toBe(firstQuote);
	});

	test("selects again when the category changes", () => {
		const firstCategory = QUOTE_CATEGORIES[0];
		const secondCategory = QUOTE_CATEGORIES[1];
		if (!(firstCategory && secondCategory)) {
			throw new Error("Expected at least two quote categories");
		}
		const { result, rerender } = renderHook(
			({ selected }) => useQuote(selected),
			{ initialProps: { selected: [firstCategory.slug] as string[] } },
		);

		rerender({ selected: [secondCategory.slug] });
		const selected = QUOTES.find((quote) => quote._id === result.current._id);

		expect(selected?.categories).toContain(secondCategory.slug);
	});
});
