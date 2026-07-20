import { describe, expect, test } from "bun:test";
import type { Bookmarks } from "@/types/bookmark";
import { flattenBookmarkFolders } from "./flatten-bookmark-folders";

const bookmarks: Bookmarks = [
	{
		id: "1",
		title: "Bookmarks Bar",
		dateAdded: 1,
		index: 0,
		children: [
			{
				id: "2",
				title: "Work",
				dateAdded: 2,
				index: 0,
				children: [],
			},
			{
				id: "3",
				title: "Vivid Tab",
				dateAdded: 3,
				index: 1,
				url: "https://vividtab.jrtilak.dev",
			},
		],
	},
];

describe("flattenBookmarkFolders", () => {
	test("preserves folder order and depth while excluding URLs", () => {
		expect(flattenBookmarkFolders(bookmarks)).toEqual([
			{ id: "1", title: "Bookmarks Bar", depth: 0 },
			{ id: "2", title: "Work", depth: 1 },
		]);
	});

	test("returns an empty array for an empty tree", () => {
		expect(flattenBookmarkFolders([])).toEqual([]);
	});
});
