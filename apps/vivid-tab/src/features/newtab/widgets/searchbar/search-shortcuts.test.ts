import { describe, expect, test } from "bun:test";
import {
	buildShortcutQuery,
	resolveDefaultSearchQuery,
} from "./search-shortcuts";

describe("search shortcuts", () => {
	test("encodes shortcut queries with the provider's expected parameter", () => {
		const chatGpt = new URL(buildShortcutQuery("chatgpt", "cats & dogs"));
		const youtube = new URL(buildShortcutQuery("youtube", "नेपाल music"));

		expect(chatGpt.origin).toBe("https://chatgpt.com");
		expect(chatGpt.searchParams.get("q")).toBe("cats & dogs");
		expect(youtube.pathname).toBe("/results");
		expect(youtube.searchParams.get("search_query")).toBe("नेपाल music");
	});

	test("maps default actions without changing a normal search", () => {
		expect(resolveDefaultSearchQuery("default", "  example.com  ")).toBe(
			"example.com",
		);
		expect(resolveDefaultSearchQuery("search-online", "  query  ")).toBe(
			"query",
		);
	});
});
