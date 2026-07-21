import { QUOTE_CATEGORIES, QUOTES } from "@/data/quotes";
import { randomInt } from "@/lib/random-int";

const SUPPORTED_CATEGORIES: ReadonlySet<string> = new Set(
	QUOTE_CATEGORIES.map((category) => category.slug),
);

type QuoteData = {
	_id: string;
	author: string;
	content: string;
};

/**
 * Selects a quote from the bundled catalog using OR semantics for categories.
 * Unknown-only selections intentionally use the full catalog so stale settings
 * cannot leave the widget empty after a catalog refresh.
 */
const selectQuote = (
	categories: readonly string[],
	random: () => number = Math.random,
): QuoteData => {
	const selectedCategories = new Set(
		categories.filter((category) => SUPPORTED_CATEGORIES.has(category)),
	);
	const eligibleQuotes =
		selectedCategories.size === 0
			? QUOTES
			: QUOTES.filter((quote) =>
					quote.categories.some((category) => selectedCategories.has(category)),
				);
	const selected =
		eligibleQuotes[randomInt(0, eligibleQuotes.length - 1, random)];

	if (!selected) throw new Error("The local quote catalog is empty");

	return {
		_id: selected._id,
		author: selected.author,
		content: selected.content,
	};
};

export type { QuoteData };
export { selectQuote };
