import { describe, expect, test } from "@test/jest";
import {
	buildShortcutQuery,
	resolveDefaultSearchQuery,
} from "./search-shortcuts";

describe("search shortcuts", () => {
	test("encodes shortcut queries with the provider's expected parameter", () => {
		const chatGpt = new URL(buildShortcutQuery("chatgpt", "cats & dogs"));
		const claude = new URL(buildShortcutQuery("claude", "  explain this  "));
		const youtube = new URL(buildShortcutQuery("youtube", "नेपाल music"));

		expect(chatGpt.origin).toBe("https://chatgpt.com");
		expect(chatGpt.searchParams.get("q")).toBe("cats & dogs");
		expect(youtube.pathname).toBe("/results");
		expect(youtube.searchParams.get("search_query")).toBe("नेपाल music");
		expect(claude.pathname).toBe("/new");
		expect(claude.searchParams.get("q")).toBe("explain this");
		expect(buildShortcutQuery("search-online", "  search  ")).toBe("search");
	});

	test("maps default actions without changing a normal search", () => {
		expect(resolveDefaultSearchQuery("default", "  example.com  ")).toBe(
			"example.com",
		);
		expect(resolveDefaultSearchQuery("search-online", "  query  ")).toBe(
			"query",
		);
		expect(resolveDefaultSearchQuery("ask-claude", " question ")).toContain(
			"claude.ai",
		);
	});
});
