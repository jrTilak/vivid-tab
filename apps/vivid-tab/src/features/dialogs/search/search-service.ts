import { BACKGROUND_ACTIONS } from "@/constants/background-actions";
import { resolveBangSearch } from "@/lib/bang-search";
import type { Settings } from "@/zod/settings";

type OpenUrlIn = Settings["general"]["openUrlIn"];

export const submitSearch = (query: string, openIn: OpenUrlIn) => {
	const target = resolveBangSearch(query);
	const resolvedQuery = target.kind === "bang" ? target.url : target.query;
	if (!resolvedQuery) return false;

	void chrome.runtime.sendMessage({
		action: BACKGROUND_ACTIONS.SEARCH_QUERY,
		openIn,
		query: resolvedQuery,
	});

	return true;
};
