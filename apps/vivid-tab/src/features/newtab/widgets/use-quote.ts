import { useMemo } from "react";
import { type QuoteData, selectQuote } from "./quote-service";

// Each New Tab evaluates this module in a new document while React rerenders
// within that document keep the selected quote stable.
const NEW_TAB_RANDOM_VALUE = Math.random();

/** Selects once per New Tab mount and again only when its categories change. */
const useQuote = (categories: readonly string[]): QuoteData => {
	const categoriesKey = [...categories].sort().join("|");

	return useMemo(
		() => selectQuote(categoriesKey.split("|"), () => NEW_TAB_RANDOM_VALUE),
		[categoriesKey],
	);
};

export { useQuote };
