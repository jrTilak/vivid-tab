import { describe, expect, test } from "bun:test";
import { getBookmarkChildren } from "./bookmark-reader";

describe("bookmark reader", () => {
	test("unwraps the browser bookmark root", () => {
		const child = {
			children: [],
			dateAdded: 0,
			id: "folder",
			index: 0,
			syncing: false,
			title: "Folder",
		} satisfies chrome.bookmarks.BookmarkTreeNode;
		const root = {
			children: [child],
			id: "0",
			index: 0,
			syncing: false,
			title: "",
		} satisfies chrome.bookmarks.BookmarkTreeNode;

		expect(getBookmarkChildren([root])).toEqual([child]);
		expect(getBookmarkChildren([])).toEqual([]);
	});
});
