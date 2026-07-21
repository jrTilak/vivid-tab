import { afterEach, describe, expect, jest, mock, test } from "@test/jest";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import type { Bookmarks } from "@/types/bookmark";
import { useFlattenBookmarkFolders } from "./use-flatten-bookmark-folders";

type Listener = (...args: never[]) => void;

const createChromeEvent = <T extends Listener>() => {
	const listeners = new Set<T>();

	return {
		addListener: (listener: T) => listeners.add(listener),
		emit: (...args: Parameters<T>) => {
			for (const listener of listeners) listener(...args);
		},
		listenerCount: () => listeners.size,
		removeListener: (listener: T) => listeners.delete(listener),
	};
};

const createFolder = (
	id: string,
	title: string,
	children: Bookmarks = [],
): Bookmarks[number] => ({
	children,
	dateAdded: 0,
	id,
	index: 0,
	title,
});

const asBrowserRoot = (children: Bookmarks) =>
	[
		{
			children,
			id: "0",
			index: 0,
			title: "",
		},
	] as chrome.bookmarks.BookmarkTreeNode[];

const originalChromeDescriptor = Object.getOwnPropertyDescriptor(
	globalThis,
	"chrome",
);

const installBookmarksChrome = ({
	getSubTree = mock(
		(
			_id: string,
			callback: (nodes: chrome.bookmarks.BookmarkTreeNode[]) => void,
		) => callback([]),
	),
	getTree = mock(
		(callback: (nodes: chrome.bookmarks.BookmarkTreeNode[]) => void) =>
			callback([]),
	),
} = {}) => {
	const events = {
		onChanged: createChromeEvent<() => void>(),
		onCreated: createChromeEvent<() => void>(),
		onMoved: createChromeEvent<() => void>(),
		onRemoved: createChromeEvent<() => void>(),
	};
	Object.defineProperty(globalThis, "chrome", {
		configurable: true,
		value: {
			bookmarks: { getSubTree, getTree, ...events },
			runtime: {},
		},
		writable: true,
	});

	return { events, getSubTree, getTree };
};

afterEach(() => {
	cleanup();
	jest.useRealTimers();
	mock.restore();
	if (originalChromeDescriptor) {
		Object.defineProperty(globalThis, "chrome", originalChromeDescriptor);
	} else {
		Reflect.deleteProperty(globalThis, "chrome");
	}
});
describe("useFlattenBookmarkFolders", () => {
	test("loads and flattens folders while excluding URL bookmarks", async () => {
		const nested = createFolder("nested", "Nested");
		const folder = createFolder("folder", "Folder", [
			nested,
			{
				dateAdded: 0,
				id: "url",
				index: 1,
				title: "Website",
				url: "https://example.com",
			},
		]);
		installBookmarksChrome({
			getTree: mock(
				(callback: (nodes: chrome.bookmarks.BookmarkTreeNode[]) => void) =>
					callback(asBrowserRoot([folder])),
			),
		});

		const { result } = renderHook(() => useFlattenBookmarkFolders());

		await waitFor(() =>
			expect(result.current).toEqual([
				{ depth: 0, id: "folder", title: "Folder" },
				{ depth: 1, id: "nested", title: "Nested" },
			]),
		);
	});
});
