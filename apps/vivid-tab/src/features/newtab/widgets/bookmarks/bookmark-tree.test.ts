import { describe, expect, test } from "bun:test";
import type { Bookmarks } from "@/types/bookmark";
import { getBookmarkReorder } from "./bookmark-dnd";
import {
	deriveBookmarkView,
	getFolderCounts,
	getValidMoveFolders,
	resolveActiveRootFolder,
	sortBookmarksByIndex,
} from "./bookmark-tree";

const bookmarks: Bookmarks = [
	{
		children: [
			{
				dateAdded: 1,
				id: "nested-url",
				index: 0,
				parentId: "folder",
				title: "Nested",
				url: "https://example.com",
			},
		],
		dateAdded: 1,
		id: "folder",
		index: 1,
		parentId: "root",
		title: "Folder",
	},
	{
		dateAdded: 1,
		id: "root-url",
		index: 0,
		parentId: "root",
		title: "Root URL",
		url: "https://example.org",
	},
];

describe("bookmark tree", () => {
	test("derives live navigation and truncates a stale nested path", () => {
		const valid = deriveBookmarkView(bookmarks, "root", "folder", []);
		expect(valid.currentParentId).toBe("folder");
		expect(valid.currentFolderChildren[0]?.id).toBe("nested-url");

		const stale = deriveBookmarkView(bookmarks, "root", "folder", ["missing"]);
		expect(stale.folderStack).toEqual([]);
		expect(stale.currentFolderChildren).toEqual([]);
	});

	test("sorts without mutating source data and counts both node types", () => {
		const sorted = sortBookmarksByIndex(bookmarks);
		expect(sorted.map(({ id }) => id)).toEqual(["root-url", "folder"]);
		expect(bookmarks[0]?.id).toBe("folder");
		expect(getFolderCounts(bookmarks)).toEqual({ bookmarks: 1, folders: 1 });
	});

	test("validates persisted roots and excludes move descendants", () => {
		expect(
			resolveActiveRootFolder({
				candidate: "missing",
				hasHomeBookmarks: false,
				rootFolderIds: ["folder"],
				showHistory: false,
				showTopSites: false,
			}),
		).toBe("folder");

		expect(
			getValidMoveFolders(
				[
					{ depth: 0, id: "folder", title: "Folder" },
					{ depth: 1, id: "child", title: "Child" },
					{ depth: 0, id: "sibling", title: "Sibling" },
				],
				"folder",
			).map(({ id }) => id),
		).toEqual(["sibling"]);
	});

	test("ignores incomplete drops and calculates a safe reorder", () => {
		expect(
			getBookmarkReorder({
				fromId: "a",
				fromIndex: 0,
				fromParentId: "folder",
				toId: undefined,
				toIndex: undefined,
				toParentId: undefined,
			}),
		).toBeUndefined();
		expect(
			getBookmarkReorder({
				fromId: "a",
				fromIndex: 0,
				fromParentId: "folder",
				toId: "b",
				toIndex: 2,
				toParentId: "folder",
			}),
		).toEqual({ bookmarkId: "a", index: 3 });
		expect(
			getBookmarkReorder({
				fromId: "a",
				fromIndex: 0,
				fromParentId: "folder-a",
				toId: "b",
				toIndex: 2,
				toParentId: "folder-b",
			}),
		).toBeUndefined();
	});
});
