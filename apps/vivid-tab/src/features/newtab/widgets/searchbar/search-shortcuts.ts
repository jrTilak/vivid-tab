import type { Settings } from "@/zod/settings";

export type SearchShortcutId =
	Settings["widgets"]["searchbar"]["shortcuts"][number];
type SearchAction = Settings["widgets"]["searchbar"]["submitDefaultAction"];

export const SEARCH_SHORTCUTS = [
	{ id: "chatgpt", icon: "assets/openai.png", name: "Ask ChatGPT" },
	{ id: "claude", icon: "assets/claude.png", name: "Ask Claude" },
	{ id: "youtube", icon: "assets/youtube.png", name: "Open YouTube" },
	{ id: "search-online", icon: "assets/search.png", name: "Search online" },
] as const satisfies ReadonlyArray<{
	id: SearchShortcutId;
	icon: string;
	name: string;
}>;

const ACTION_SHORTCUTS: Partial<Record<SearchAction, SearchShortcutId>> = {
	"ask-chatgpt": "chatgpt",
	"ask-claude": "claude",
	"search-on-youtube": "youtube",
	"search-online": "search-online",
};

export const buildShortcutQuery = (
	shortcutId: SearchShortcutId,
	query: string,
) => {
	const normalizedQuery = query.trim();
	if (shortcutId === "search-online") return normalizedQuery;

	const baseUrl =
		shortcutId === "chatgpt"
			? "https://chatgpt.com/"
			: shortcutId === "claude"
				? "https://claude.ai/new"
				: "https://youtube.com/results";
	const url = new URL(baseUrl);
	url.searchParams.set(
		shortcutId === "youtube" ? "search_query" : "q",
		normalizedQuery,
	);

	return url.href;
};

export const resolveDefaultSearchQuery = (
	action: SearchAction,
	query: string,
) => {
	const shortcutId = ACTION_SHORTCUTS[action];

	return shortcutId ? buildShortcutQuery(shortcutId, query) : query.trim();
};
