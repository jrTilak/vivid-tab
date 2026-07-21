const SEARCH_SUGGESTIONS_ENDPOINT =
	"https://suggestqueries.google.com/complete/search";

/**
 * Builds the provider URL through URLSearchParams so arbitrary query text
 * cannot alter fixed provider parameters.
 */
export const buildSearchSuggestionsUrl = (query: string) => {
	const url = new URL(SEARCH_SUGGESTIONS_ENDPOINT);
	url.searchParams.set("client", "firefox");
	url.searchParams.set("q", query.trim());

	return url.href;
};

/**
 * Validates the provider's untrusted tuple response, removes blank and duplicate
 * suggestions, and caps the list before it reaches render state.
 */
export const parseSearchSuggestions = (value: unknown): string[] => {
	if (!Array.isArray(value) || !Array.isArray(value[1])) return [];

	const suggestions = value[1]
		.filter(
			(suggestion): suggestion is string => typeof suggestion === "string",
		)
		.map((suggestion) => suggestion.trim())
		.filter(Boolean);

	return [...new Set(suggestions)].slice(0, 10);
};
