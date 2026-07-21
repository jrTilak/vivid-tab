const SEARCH_SUGGESTIONS_ENDPOINT =
	"https://suggestqueries.google.com/complete/search";

/**
 * Firefox add-on policy forbids sending text while a user types in extension
 * search UI. Chromium keeps the opt-in provider integration; Firefox does not
 * request its host permission or execute the remote suggestion path.
 */
export const supportsRemoteSearchSuggestions = (
	browserName: string | undefined,
): boolean => browserName !== "firefox";

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
