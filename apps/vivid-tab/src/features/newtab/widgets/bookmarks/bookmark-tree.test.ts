import { describe, expect, test } from "@test/jest";
import type { Bookmarks } from "@/types/bookmark";
import { getBookmarkReorder } from "./bookmark-dnd";
import {
	deriveBookmarkView,
	getFolderCounts,
	getValidMoveFolders,
	isBookmarkFolder,
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

	test("derives home and virtual-root views without treating empty folders as URLs", () => {
		const emptyFolder: Bookmarks[number] = {
			children: [],
			dateAdded: 1,
			id: "empty",
			index: 2,
			parentId: "root",
			title: "Empty",
			/* Firefox exposes this property on folder objects. */
			url: undefined,
		};
		const source = [...bookmarks, emptyFolder];
		const home = deriveBookmarkView(source, "root", "home", []);

		expect(home.currentFolderChildren.map(({ id }) => id)).toEqual([
			"root-url",
		]);
		expect(home.currentParentId).toBe("root");
		expect(home.rootFolders.map(({ id }) => id)).toEqual(["folder", "empty"]);
		expect(isBookmarkFolder(emptyFolder)).toBe(true);

		for (const virtualRoot of ["history", "top-sites"]) {
			const view = deriveBookmarkView(source, "root", virtualRoot, []);
			expect(view.currentFolderChildren).toEqual([]);
			expect(view.currentParentId).toBeUndefined();
		}
	});

	test("keeps the last valid folder when a deeper path segment is stale", () => {
		const nested = deriveBookmarkView(bookmarks, "root", "home", [
			"folder",
			"missing",
		]);

		expect(nested.folderStack.map(({ id }) => id)).toEqual(["folder"]);
		expect(nested.currentParentId).toBe("folder");
		expect(nested.currentFolderChildren[0]?.id).toBe("nested-url");
	});

	test("sorts without mutating source data and counts both node types", () => {
		const sorted = sortBookmarksByIndex(bookmarks);
		expect(sorted.map(({ id }) => id)).toEqual(["root-url", "folder"]);
		expect(bookmarks[0]?.id).toBe("folder");
		expect(getFolderCounts(bookmarks)).toEqual({ bookmarks: 1, folders: 1 });
		expect(getFolderCounts()).toEqual({ bookmarks: 0, folders: 0 });
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

		expect(
			resolveActiveRootFolder({
				candidate: "history",
				hasHomeBookmarks: true,
				rootFolderIds: ["folder"],
				showHistory: true,
				showTopSites: false,
			}),
		).toBe("history");
		expect(
			resolveActiveRootFolder({
				candidate: "top-sites",
				hasHomeBookmarks: true,
				rootFolderIds: [],
				showHistory: false,
				showTopSites: false,
			}),
		).toBe("home");

		const folders = [{ depth: 0, id: "other", title: "Other" }];
		expect(getValidMoveFolders(folders, "missing")).toBe(folders);
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
