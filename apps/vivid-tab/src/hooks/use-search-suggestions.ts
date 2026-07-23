import { useEffect, useState } from "react";
import {
	buildSearchSuggestionsUrl,
	parseSearchSuggestions,
	supportsRemoteSearchSuggestions,
} from "@/lib/search-suggestions";

type Props = {
	query: string;
	enabled?: boolean;
};

/** Fetches validated suggestions and cancels stale requests as the query changes. */
const useSearchSuggestions = ({ query, enabled = true }: Props) => {
	const [suggestions, setSuggestions] = useState<string[]>([]);

	useEffect(() => {
		const normalizedQuery = query.trim();
		const abortController = new AbortController();
		const isSupported = supportsRemoteSearchSuggestions(
			process.env.PLASMO_PUBLIC_BROWSER_NAME,
		);

		setSuggestions([]);
		if (!isSupported || !enabled || !normalizedQuery) {
			return () => abortController.abort();
		}

		const loadSuggestions = async () => {
			try {
				const response = await fetch(
					buildSearchSuggestionsUrl(normalizedQuery),
					{ signal: abortController.signal },
				);
				if (!response.ok) throw new Error("Search suggestions request failed");

				const data: unknown = await response.json();
				if (!abortController.signal.aborted) {
					setSuggestions(parseSearchSuggestions(data));
				}
			} catch {
				if (!abortController.signal.aborted) setSuggestions([]);
			}
		};

		void loadSuggestions();

		return () => abortController.abort();
	}, [enabled, query]);

	return suggestions;
};

export { useSearchSuggestions };
