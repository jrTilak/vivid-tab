import { afterEach, describe, expect, jest, mock, test } from "@test/jest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { Bookmarks } from "@/types/bookmark";
import { useBookmarks } from "./use-bookmarks";

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

describe("useBookmarks", () => {
	test("loads the complete tree when no root folder is supplied", async () => {
		const folder = createFolder("folder", "Folder");
		const getTree = mock(
			(callback: (nodes: chrome.bookmarks.BookmarkTreeNode[]) => void) =>
				callback(asBrowserRoot([folder])),
		);
		const { getSubTree } = installBookmarksChrome({ getTree });

		const { result } = renderHook(() => useBookmarks());

		await waitFor(() => expect(result.current).toEqual([folder]));
		expect(getTree).toHaveBeenCalledTimes(1);
		expect(getSubTree).not.toHaveBeenCalled();
	});

	test("loads only the requested folder subtree", async () => {
		const child = createFolder("child", "Child");
		const getSubTree = mock(
			(
				_id: string,
				callback: (nodes: chrome.bookmarks.BookmarkTreeNode[]) => void,
			) => callback(asBrowserRoot([child])),
		);
		const { getTree } = installBookmarksChrome({ getSubTree });

		const { result } = renderHook(() => useBookmarks("folder"));

		await waitFor(() => expect(result.current).toEqual([child]));
		expect(getSubTree).toHaveBeenCalledWith("folder", expect.any(Function));
		expect(getTree).not.toHaveBeenCalled();
	});

	test("coalesces bursts of bookmark events into one refresh", async () => {
		jest.useFakeTimers();
		const getTree = mock(
			(callback: (nodes: chrome.bookmarks.BookmarkTreeNode[]) => void) =>
				callback(asBrowserRoot([])),
		);
		const { events } = installBookmarksChrome({ getTree });
		renderHook(() => useBookmarks());
		await act(async () => Promise.resolve());
		expect(getTree).toHaveBeenCalledTimes(1);

		act(() => {
			events.onCreated.emit();
			events.onChanged.emit();
			jest.advanceTimersByTime(24);
			events.onMoved.emit();
		});
		expect(getTree).toHaveBeenCalledTimes(1);

		await act(async () => {
			jest.advanceTimersByTime(25);
			await Promise.resolve();
		});
		expect(getTree).toHaveBeenCalledTimes(2);
	});

	test("publishes only the newest result when requests finish out of order", async () => {
		jest.useFakeTimers();
		const callbacks: Array<
			(nodes: chrome.bookmarks.BookmarkTreeNode[]) => void
		> = [];
		const getTree = mock(
			(callback: (nodes: chrome.bookmarks.BookmarkTreeNode[]) => void) => {
				callbacks.push(callback);
			},
		);
		const { events } = installBookmarksChrome({ getTree });
		const { result } = renderHook(() => useBookmarks());
		expect(callbacks).toHaveLength(1);

		await act(async () => {
			events.onChanged.emit();
			jest.advanceTimersByTime(25);
			await Promise.resolve();
		});
		expect(callbacks).toHaveLength(2);

		await act(async () => {
			callbacks[1]?.(asBrowserRoot([createFolder("new", "New")]));
			await Promise.resolve();
		});
		expect(result.current[0]?.id).toBe("new");

		await act(async () => {
			callbacks[0]?.(asBrowserRoot([createFolder("old", "Old")]));
			await Promise.resolve();
		});
		expect(result.current[0]?.id).toBe("new");
	});

	test("ignores a stale failure after a newer request succeeds", async () => {
		jest.useFakeTimers();
		const callbacks: Array<
			(nodes: chrome.bookmarks.BookmarkTreeNode[]) => void
		> = [];
		const getTree = mock(
			(callback: (nodes: chrome.bookmarks.BookmarkTreeNode[]) => void) => {
				callbacks.push(callback);
			},
		);
		const { events } = installBookmarksChrome({ getTree });
		const consoleError = jest
			.spyOn(console, "error")
			.mockImplementation(() => undefined);
		const { result } = renderHook(() => useBookmarks());

		await act(async () => {
			events.onChanged.emit();
			jest.advanceTimersByTime(25);
			await Promise.resolve();
		});
		expect(callbacks).toHaveLength(2);

		await act(async () => {
			callbacks[1]?.(asBrowserRoot([createFolder("new", "New")]));
			await Promise.resolve();
		});
		expect(result.current[0]?.id).toBe("new");

		await act(async () => {
			Object.assign(chrome.runtime, {
				lastError: { message: "Stale request failed" },
			});
			callbacks[0]?.([]);
			Reflect.deleteProperty(chrome.runtime, "lastError");
			await Promise.resolve();
		});

		expect(result.current[0]?.id).toBe("new");
		expect(consoleError).not.toHaveBeenCalled();
	});

	test("clears data after the latest browser read fails", async () => {
		const consoleError = jest
			.spyOn(console, "error")
			.mockImplementation(() => undefined);
		const getTree = mock(
			(callback: (nodes: chrome.bookmarks.BookmarkTreeNode[]) => void) => {
				Object.assign(chrome.runtime, {
					lastError: { message: "Bookmarks unavailable" },
				});
				callback([]);
				Reflect.deleteProperty(chrome.runtime, "lastError");
			},
		);
		installBookmarksChrome({ getTree });

		const { result } = renderHook(() => useBookmarks());

		await waitFor(() => expect(consoleError).toHaveBeenCalledTimes(1));
		expect(result.current).toEqual([]);
		expect(consoleError.mock.calls[0]?.[0]).toBe("Failed to read bookmarks:");
	});

	test("removes listeners and cancels a scheduled refresh on unmount", () => {
		jest.useFakeTimers();
		const { events, getTree } = installBookmarksChrome();
		const { unmount } = renderHook(() => useBookmarks());

		expect(Object.values(events).map((event) => event.listenerCount())).toEqual(
			[1, 1, 1, 1],
		);
		act(() => events.onRemoved.emit());
		unmount();
		jest.advanceTimersByTime(25);

		expect(Object.values(events).map((event) => event.listenerCount())).toEqual(
			[0, 0, 0, 0],
		);
		expect(getTree).toHaveBeenCalledTimes(1);
	});
});
