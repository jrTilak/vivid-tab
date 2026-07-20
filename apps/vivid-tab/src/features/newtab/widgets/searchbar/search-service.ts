import { BACKGROUND_ACTIONS } from "@/constants/background-actions";
import type { Settings } from "@/zod/settings";

type OpenUrlIn = Settings["general"]["openUrlIn"];

export const submitSearch = (query: string, openIn: OpenUrlIn) => {
	const normalizedQuery = query.trim();
	if (!normalizedQuery) return false;

	void chrome.runtime.sendMessage({
		action: BACKGROUND_ACTIONS.SEARCH_QUERY,
		openIn,
		query: normalizedQuery,
	});

	return true;
};
