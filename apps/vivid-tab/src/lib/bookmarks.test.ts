import {
	afterEach,
	beforeEach,
	describe,
	expect,
	mock,
	spyOn,
	test,
} from "@test/jest";
import { BACKGROUND_ACTIONS } from "@/constants/background-actions";
import type { Bookmarks } from "@/types/bookmark";
import {
	BOOKMARK_ICON_STORAGE_PREFIX,
	BOOKMARK_ICON_UPDATE_EVENT,
	createBookmarkRootResolver,
	ensureRootBookmarkFolder,
	findBookmarkFolder,
	flattenBookmarkFolders,
	getBookmarkChildren,
	getBookmarkIconSnapshot,
	getBookmarkIconStorageKey,
	getFileIcon,
	notifyBookmarkIconChanged,
	parseStoredBookmarkIcon,
	readBookmarks,
	refreshBookmarkIcon,
	resolveBookmarkRootFolder,
	subscribeBookmarkIcon,
} from "./bookmarks";

type StorageChangeListener = Parameters<
	typeof chrome.storage.onChanged.addListener
>[0];

const originalChrome = globalThis.chrome;

let getStoredIcons: ReturnType<typeof mock>;
let storageChangeListeners: Set<StorageChangeListener>;

const folder = (
	id: string,
	title: string,
	children?: chrome.bookmarks.BookmarkTreeNode[],
): chrome.bookmarks.BookmarkTreeNode => ({
	children,
	id,
	index: 0,
	parentId: "parent",
	syncing: false,
	title,
});

const nestedBookmarks: Bookmarks = [
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

const setRuntime = (
	callbackResponse: unknown,
	lastError?: { message: string },
) => {
	let sentMessage: unknown;

	globalThis.chrome = {
		runtime: {
			lastError,
			sendMessage: (message, callback) => {
				sentMessage = message;
				callback(callbackResponse);
			},
		},
	} as unknown as typeof chrome;

	return () => sentMessage;
};

const installIconBrowserMocks = (
	values: Record<string, unknown> = {},
	readError?: Error,
) => {
	storageChangeListeners = new Set();
	getStoredIcons = mock(async (keys: string[]) => {
		if (readError) throw readError;

		return Object.fromEntries(
			keys.filter((key) => key in values).map((key) => [key, values[key]]),
		);
	});

	globalThis.chrome = {
		storage: {
			local: { get: getStoredIcons },
			onChanged: {
				addListener: (listener: StorageChangeListener) => {
					storageChangeListeners.add(listener);
				},
				removeListener: (listener: StorageChangeListener) => {
					storageChangeListeners.delete(listener);
				},
			},
		},
	} as unknown as typeof chrome;
};

beforeEach(() => installIconBrowserMocks());

afterEach(() => {
	globalThis.chrome = originalChrome;
});

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
		const nodeWithoutChildren = {
			...child,
			children: undefined,
		};
		expect(getBookmarkChildren([nodeWithoutChildren])).toEqual([
			nodeWithoutChildren,
		]);
	});

	test("reads only a configured subtree and unwraps its children", async () => {
		const child = {
			dateAdded: 0,
			id: "child",
			index: 0,
			syncing: false,
			title: "Child",
			url: "https://example.com",
		} satisfies chrome.bookmarks.BookmarkTreeNode;
		const folder = {
			children: [child],
			dateAdded: 0,
			id: "folder",
			index: 0,
			syncing: false,
			title: "Folder",
		} satisfies chrome.bookmarks.BookmarkTreeNode;
		const getSubTree = mock(
			(
				_id: string,
				callback: (nodes: chrome.bookmarks.BookmarkTreeNode[]) => void,
			) => callback([folder]),
		);
		const getTree = mock(() => undefined);
		globalThis.chrome = {
			bookmarks: { getSubTree, getTree },
			runtime: {},
		} as unknown as typeof chrome;

		await expect(readBookmarks("folder")).resolves.toEqual([child]);
		expect(getSubTree).toHaveBeenCalledWith("folder", expect.any(Function));
		expect(getTree).not.toHaveBeenCalled();
	});

	test("reads the complete bookmark tree when no folder is configured", async () => {
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
		const getTree = mock(
			(callback: (nodes: chrome.bookmarks.BookmarkTreeNode[]) => void) =>
				callback([root]),
		);
		const getSubTree = mock(() => undefined);
		globalThis.chrome = {
			bookmarks: { getSubTree, getTree },
			runtime: {},
		} as unknown as typeof chrome;

		await expect(readBookmarks()).resolves.toEqual([child]);
		expect(getTree).toHaveBeenCalledTimes(1);
		expect(getSubTree).not.toHaveBeenCalled();
	});

	test("rejects with the browser runtime error", async () => {
		const getSubTree = mock(
			(
				_id: string,
				callback: (nodes: chrome.bookmarks.BookmarkTreeNode[]) => void,
			) => callback([]),
		);
		globalThis.chrome = {
			bookmarks: { getSubTree },
			runtime: { lastError: { message: "Folder was removed" } },
		} as unknown as typeof chrome;

		await expect(readBookmarks("missing")).rejects.toThrow(
			"Folder was removed",
		);
	});

	test("rejects full-tree reads with the browser runtime error", async () => {
		const getTree = mock(
			(callback: (nodes: chrome.bookmarks.BookmarkTreeNode[]) => void) =>
				callback([]),
		);
		globalThis.chrome = {
			bookmarks: { getTree },
			runtime: { lastError: { message: "Bookmarks unavailable" } },
		} as unknown as typeof chrome;

		await expect(readBookmarks()).rejects.toThrow("Bookmarks unavailable");
	});
});

describe("findBookmarkFolder", () => {
	test("finds nested folders in tree order and ignores URL nodes", () => {
		const match = folder("match", "Vivid Tab");
		const tree: chrome.bookmarks.BookmarkTreeNode[] = [
			{
				children: [
					{
						id: "url",
						index: 0,
						parentId: "root",
						syncing: false,
						title: "Vivid Tab",
						url: "https://example.com",
					},
					match,
				],
				id: "root",
				index: 0,
				syncing: false,
				title: "Vivid Tab",
			},
		];

		expect(findBookmarkFolder(tree, (node) => node.title === "Vivid Tab")).toBe(
			match,
		);
	});

	test("returns undefined for empty trees and unmatched root nodes", () => {
		expect(findBookmarkFolder([], () => true)).toBeUndefined();
		expect(
			findBookmarkFolder(
				[{ id: "root", index: 0, syncing: false, title: "Vivid Tab" }],
				() => true,
			),
		).toBeUndefined();
	});
});

describe("createBookmarkRootResolver", () => {
	test("uses a valid configured folder without reading the full tree", async () => {
		let treeReads = 0;
		let creations = 0;
		const resolveRoot = createBookmarkRootResolver({
			createFolder: async () => {
				creations += 1;
				return folder("created", "Vivid Tab");
			},
			getFolderById: async () => folder("configured", "Custom"),
			getTree: async () => {
				treeReads += 1;
				return [];
			},
		});

		expect(await resolveRoot("configured")).toBe("configured");
		expect(treeReads).toBe(0);
		expect(creations).toBe(0);
	});

	test("rejects configured URLs and reuses current or legacy named folders", async () => {
		const trees = [
			[folder("current", "Vivid Tab")],
			[folder("legacy", "vivid-tab-bookmarks")],
		];
		let treeIndex = 0;
		const resolveRoot = createBookmarkRootResolver({
			createFolder: async () => folder("created", "Vivid Tab"),
			getFolderById: async () => ({
				id: "configured-url",
				index: 0,
				parentId: "parent",
				syncing: false,
				title: "Not a folder",
				url: "https://example.com",
			}),
			getTree: async () => trees[treeIndex++] ?? [],
		});

		expect(await resolveRoot("configured-url")).toBe("current");
		expect(await resolveRoot("")).toBe("legacy");
	});

	test("falls back when a configured folder was deleted", async () => {
		const resolveRoot = createBookmarkRootResolver({
			createFolder: async () => folder("created", "Vivid Tab"),
			getFolderById: async () => undefined,
			getTree: async () => [folder("existing", "Vivid Tab")],
		});

		expect(await resolveRoot("deleted-folder")).toBe("existing");
	});

	test("coalesces concurrent creation requests", async () => {
		let creations = 0;
		let finishCreation:
			| ((node: chrome.bookmarks.BookmarkTreeNode) => void)
			| null = null;
		const resolveRoot = createBookmarkRootResolver({
			createFolder: () => {
				creations += 1;
				return new Promise((resolve) => {
					finishCreation = resolve;
				});
			},
			getFolderById: async () => undefined,
			getTree: async () => [],
		});
		const first = resolveRoot("");
		const second = resolveRoot("");

		await Promise.resolve();
		await Promise.resolve();
		expect(creations).toBe(1);
		finishCreation?.(folder("created", "Vivid Tab"));

		expect(await Promise.all([first, second])).toEqual(["created", "created"]);
	});

	test("clears a rejected creation so the next call can retry", async () => {
		let attempts = 0;
		const resolveRoot = createBookmarkRootResolver({
			createFolder: async () => {
				attempts += 1;
				if (attempts === 1) throw new Error("creation failed");

				return folder("created", "Vivid Tab");
			},
			getFolderById: async () => undefined,
			getTree: async () => [],
		});

		await expect(resolveRoot("")).rejects.toThrow("creation failed");
		expect(await resolveRoot("")).toBe("created");
		expect(attempts).toBe(2);
	});
});

describe("Chrome bookmark root adapter", () => {
	const installChrome = ({
		createdFolder = folder("created", "Vivid Tab"),
		configuredFolders = [],
		createError,
		tree = [],
		treeError,
	}: {
		createdFolder?: chrome.bookmarks.BookmarkTreeNode;
		configuredFolders?: chrome.bookmarks.BookmarkTreeNode[];
		createError?: string;
		tree?: chrome.bookmarks.BookmarkTreeNode[];
		treeError?: string;
	} = {}) => {
		let runtimeError: chrome.runtime.LastError | undefined;
		const get = mock(
			(
				_id: string,
				callback: (nodes: chrome.bookmarks.BookmarkTreeNode[]) => void,
			) => {
				runtimeError =
					configuredFolders.length === 0 ? { message: "missing" } : undefined;
				callback(configuredFolders);
				runtimeError = undefined;
			},
		);
		const getTree = mock(
			(callback: (nodes: chrome.bookmarks.BookmarkTreeNode[]) => void) => {
				runtimeError = treeError ? { message: treeError } : undefined;
				callback(tree);
				runtimeError = undefined;
			},
		);
		const create = mock(
			(
				_details: chrome.bookmarks.CreateDetails,
				callback: (node: chrome.bookmarks.BookmarkTreeNode) => void,
			) => {
				runtimeError = createError ? { message: createError } : undefined;
				callback(createdFolder);
				runtimeError = undefined;
			},
		);

		globalThis.chrome = {
			bookmarks: { create, get, getTree },
			runtime: {
				get lastError() {
					return runtimeError;
				},
			},
		} as unknown as typeof chrome;

		return { create, get, getTree };
	};

	test("uses a configured Chrome folder without scanning or creating", async () => {
		const operations = installChrome({
			configuredFolders: [folder("configured", "Custom")],
		});

		await expect(resolveBookmarkRootFolder("configured")).resolves.toBe(
			"configured",
		);
		expect(operations.getTree).not.toHaveBeenCalled();
		expect(operations.create).not.toHaveBeenCalled();
	});

	test("falls back from a deleted ID and creates the default folder", async () => {
		const operations = installChrome();

		await expect(resolveBookmarkRootFolder("deleted")).resolves.toBe("created");
		expect(operations.getTree).toHaveBeenCalledTimes(1);
		expect(operations.create).toHaveBeenCalledWith(
			{ title: "Vivid Tab" },
			expect.any(Function),
		);
	});

	test("surfaces Chrome tree and folder-creation failures", async () => {
		installChrome({ treeError: "tree denied" });
		await expect(resolveBookmarkRootFolder("")).rejects.toThrow("tree denied");

		installChrome({ createError: "create denied" });
		await expect(resolveBookmarkRootFolder("")).rejects.toThrow(
			"create denied",
		);
	});
});

describe("flattenBookmarkFolders", () => {
	test("preserves folder order and depth while excluding URLs", () => {
		expect(flattenBookmarkFolders(nestedBookmarks)).toEqual([
			{ id: "1", title: "Bookmarks Bar", depth: 0 },
			{ id: "2", title: "Work", depth: 1 },
		]);
	});

	test("recognizes Firefox folders with an explicit undefined URL", () => {
		const firefoxFolder: Bookmarks[number] = {
			children: [],
			dateAdded: 1,
			id: "firefox-folder",
			index: 0,
			title: "Firefox folder",
			url: undefined,
		};

		expect(flattenBookmarkFolders([firefoxFolder])).toEqual([
			{ depth: 0, id: "firefox-folder", title: "Firefox folder" },
		]);
	});

	test("returns an empty array for an empty tree", () => {
		expect(flattenBookmarkFolders([])).toEqual([]);
	});

	test("supports a caller-provided starting depth and output accumulator", () => {
		const existing = [{ id: "existing", title: "Existing", depth: 0 }];

		const result = flattenBookmarkFolders(nestedBookmarks, 2, existing);

		expect(result).toBe(existing);
		expect(result.slice(1)).toEqual([
			{ id: "1", title: "Bookmarks Bar", depth: 2 },
			{ id: "2", title: "Work", depth: 3 },
		]);
	});
});

describe("ensureRootBookmarkFolder", () => {
	test("sends the configured ID and resolves a valid response", async () => {
		const getSentMessage = setRuntime({ folderId: "resolved", ok: true });

		await expect(ensureRootBookmarkFolder("configured")).resolves.toBe(
			"resolved",
		);
		expect(getSentMessage()).toEqual({
			action: BACKGROUND_ACTIONS.ENSURE_ROOT_BOOKMARK_FOLDER,
			rootFolderId: "configured",
		});
	});

	test("rejects a Chrome runtime error before inspecting the response", async () => {
		setRuntime({ folderId: "ignored", ok: true }, { message: "port closed" });

		await expect(ensureRootBookmarkFolder("folder")).rejects.toThrow(
			"port closed",
		);
	});

	test("rejects explicit background failures", async () => {
		setRuntime({ error: "bookmark permission denied", ok: false });

		await expect(ensureRootBookmarkFolder("")).rejects.toThrow(
			"bookmark permission denied",
		);
	});

	test.each([
		undefined,
		{ ok: true },
		{ folderId: "", ok: true },
		{ error: "", ok: false },
	])("rejects malformed responses: %j", async (response) => {
		setRuntime(response);

		await expect(ensureRootBookmarkFolder("")).rejects.toThrow(
			"Unable to resolve bookmark folder",
		);
	});
});
describe("bookmark icon values", () => {
	test("builds namespaced keys and accepts only non-empty string icons", () => {
		expect(getBookmarkIconStorageKey("42")).toBe(
			`${BOOKMARK_ICON_STORAGE_PREFIX}42`,
		);
		expect(parseStoredBookmarkIcon({ icon: "data:image/png;base64,abc" })).toBe(
			"data:image/png;base64,abc",
		);
		expect(parseStoredBookmarkIcon({ icon: "" })).toBeNull();
		expect(parseStoredBookmarkIcon({ icon: 42 })).toBeNull();
		expect(parseStoredBookmarkIcon({})).toBeNull();
		expect(parseStoredBookmarkIcon(null)).toBeNull();
	});

	test("publishes the changed bookmark id in a custom event", () => {
		let detail: unknown;
		window.addEventListener(BOOKMARK_ICON_UPDATE_EVENT, (event) => {
			detail = (event as CustomEvent).detail;
		});

		notifyBookmarkIconChanged("bookmark-1");

		expect(detail).toEqual({ id: "bookmark-1" });
	});
});

describe("bookmark icon store", () => {
	test("batches uncached reads and shares one pair of global listeners", async () => {
		installIconBrowserMocks({
			"icon-batch-a": { icon: "a.svg" },
			"icon-batch-b": { icon: "b.svg" },
		});
		const listenerA = mock(() => undefined);
		const listenerB = mock(() => undefined);
		const unsubscribeA = subscribeBookmarkIcon("batch-a", listenerA);
		const unsubscribeB = subscribeBookmarkIcon("batch-b", listenerB);

		await Promise.all([
			refreshBookmarkIcon("batch-a"),
			refreshBookmarkIcon("batch-b"),
		]);

		expect(getStoredIcons).toHaveBeenCalledTimes(1);
		expect(new Set(getStoredIcons.mock.calls[0]?.[0] as string[])).toEqual(
			new Set(["icon-batch-a", "icon-batch-b"]),
		);
		expect(getBookmarkIconSnapshot("batch-a")).toBe("a.svg");
		expect(getBookmarkIconSnapshot("batch-b")).toBe("b.svg");
		expect(listenerA).toHaveBeenCalledTimes(1);
		expect(listenerB).toHaveBeenCalledTimes(1);
		expect(storageChangeListeners.size).toBe(1);

		unsubscribeA();
		expect(storageChangeListeners.size).toBe(1);
		unsubscribeB();
		expect(storageChangeListeners.size).toBe(0);
	});

	test("treats repeated unsubscribe calls as a no-op", async () => {
		const unsubscribeA = subscribeBookmarkIcon("cleanup-a", () => undefined);
		const unsubscribeB = subscribeBookmarkIcon("cleanup-b", () => undefined);
		await Promise.all([
			refreshBookmarkIcon("cleanup-a"),
			refreshBookmarkIcon("cleanup-b"),
		]);

		unsubscribeA();
		unsubscribeA();
		expect(storageChangeListeners.size).toBe(1);

		unsubscribeB();
		expect(storageChangeListeners.size).toBe(0);
	});

	test("updates subscribers from local storage changes and ignores other areas", async () => {
		installIconBrowserMocks({ "icon-storage-change": { icon: "old.svg" } });
		const listener = mock(() => undefined);
		const unsubscribe = subscribeBookmarkIcon("storage-change", listener);
		await refreshBookmarkIcon("storage-change");
		listener.mockClear();

		for (const handleChange of storageChangeListeners) {
			handleChange(
				{ "icon-storage-change": { newValue: { icon: "ignored.svg" } } },
				"sync",
			);
			handleChange(
				{ "another-key": { newValue: { icon: "ignored.svg" } } },
				"local",
			);
		}
		expect(listener).not.toHaveBeenCalled();
		expect(getBookmarkIconSnapshot("storage-change")).toBe("old.svg");

		for (const handleChange of storageChangeListeners) {
			handleChange(
				{ "icon-storage-change": { newValue: { icon: "new.svg" } } },
				"local",
			);
		}
		expect(getBookmarkIconSnapshot("storage-change")).toBe("new.svg");
		expect(listener).toHaveBeenCalledTimes(1);

		for (const handleChange of storageChangeListeners) {
			handleChange(
				{ "icon-storage-change": { newValue: { icon: "new.svg" } } },
				"local",
			);
		}
		expect(listener).toHaveBeenCalledTimes(1);

		for (const handleChange of storageChangeListeners) {
			handleChange({ "icon-storage-change": { newValue: undefined } }, "local");
		}
		expect(getBookmarkIconSnapshot("storage-change", "fallback.svg")).toBe(
			"fallback.svg",
		);
		expect(listener).toHaveBeenCalledTimes(2);
		unsubscribe();
	});

	test("shares listeners for the same icon and removes them independently", async () => {
		const first = mock(() => undefined);
		const second = mock(() => undefined);
		const unsubscribeFirst = subscribeBookmarkIcon("shared", first);
		const unsubscribeSecond = subscribeBookmarkIcon("shared", second);

		await refreshBookmarkIcon("shared");
		expect(getStoredIcons).toHaveBeenCalledTimes(1);
		expect(storageChangeListeners.size).toBe(1);

		unsubscribeFirst();
		expect(storageChangeListeners.size).toBe(1);
		unsubscribeSecond();
		expect(storageChangeListeners.size).toBe(0);
	});

	test("drops an unmounted icon while other icon subscribers remain", async () => {
		installIconBrowserMocks({
			"icon-removed": { icon: "removed.svg" },
			"icon-retained": { icon: "retained.svg" },
		});
		const unsubscribeRemoved = subscribeBookmarkIcon(
			"removed",
			() => undefined,
		);
		const unsubscribeRetained = subscribeBookmarkIcon(
			"retained",
			() => undefined,
		);
		await Promise.all([
			refreshBookmarkIcon("removed"),
			refreshBookmarkIcon("retained"),
		]);

		unsubscribeRemoved();
		expect(getBookmarkIconSnapshot("removed", "fallback.svg")).toBe(
			"fallback.svg",
		);
		expect(getBookmarkIconSnapshot("retained")).toBe("retained.svg");
		getStoredIcons.mockClear();

		for (const handleChange of storageChangeListeners) {
			handleChange(
				{ "icon-removed": { newValue: { icon: "stale.svg" } } },
				"local",
			);
		}
		notifyBookmarkIconChanged("removed");
		await Promise.resolve();

		expect(getBookmarkIconSnapshot("removed", "fallback.svg")).toBe(
			"fallback.svg",
		);
		expect(getStoredIcons).not.toHaveBeenCalled();
		unsubscribeRetained();
	});

	test("ignores malformed editor events", async () => {
		const unsubscribe = subscribeBookmarkIcon("event-target", () => undefined);
		await refreshBookmarkIcon("event-target");
		getStoredIcons.mockClear();

		window.dispatchEvent(
			new CustomEvent(BOOKMARK_ICON_UPDATE_EVENT, { detail: { id: 42 } }),
		);
		await Promise.resolve();

		expect(getStoredIcons).not.toHaveBeenCalled();
		unsubscribe();
	});

	test("refreshes a subscribed icon after the editor notification", async () => {
		const values: Record<string, unknown> = {
			"icon-editor-change": { icon: "before.svg" },
		};
		installIconBrowserMocks(values);
		const listener = mock(() => undefined);
		const unsubscribe = subscribeBookmarkIcon("editor-change", listener);
		await refreshBookmarkIcon("editor-change");

		values["icon-editor-change"] = { icon: "after.svg" };
		notifyBookmarkIconChanged("editor-change");
		await refreshBookmarkIcon("editor-change");

		expect(getBookmarkIconSnapshot("editor-change")).toBe("after.svg");
		expect(getStoredIcons).toHaveBeenCalledTimes(2);
		unsubscribe();
	});

	test("reloads an icon after the final subscriber unmounts", async () => {
		const values: Record<string, unknown> = {
			"icon-remount": { icon: "before.svg" },
		};
		installIconBrowserMocks(values);
		const firstUnsubscribe = subscribeBookmarkIcon("remount", () => undefined);
		await refreshBookmarkIcon("remount");
		expect(getBookmarkIconSnapshot("remount")).toBe("before.svg");

		firstUnsubscribe();
		expect(getBookmarkIconSnapshot("remount", "fallback.svg")).toBe(
			"fallback.svg",
		);
		values["icon-remount"] = { icon: "after.svg" };
		const secondUnsubscribe = subscribeBookmarkIcon("remount", () => undefined);
		await refreshBookmarkIcon("remount");

		expect(getBookmarkIconSnapshot("remount")).toBe("after.svg");
		expect(getStoredIcons).toHaveBeenCalledTimes(2);
		secondUnsubscribe();
	});

	test("falls back after storage errors and supports missing bookmark ids", async () => {
		installIconBrowserMocks({}, new Error("storage unavailable"));
		const consoleError = spyOn(console, "error").mockImplementation(
			() => undefined,
		);

		await refreshBookmarkIcon("failed-read");

		expect(getBookmarkIconSnapshot("failed-read", "fallback.svg")).toBe(
			"fallback.svg",
		);
		expect(getBookmarkIconSnapshot("failed-read")).toBeNull();
		expect(getBookmarkIconSnapshot(undefined)).toBeNull();
		expect(consoleError).toHaveBeenCalledTimes(1);
		const unsubscribe = subscribeBookmarkIcon(undefined, () => undefined);
		expect(storageChangeListeners.size).toBe(0);
		unsubscribe();
		consoleError.mockRestore();
	});

	test("does not restore stale cache data after the final unsubscribe", async () => {
		let finishRead: ((value: Record<string, unknown>) => void) | undefined;
		getStoredIcons.mockImplementationOnce(
			() =>
				new Promise<Record<string, unknown>>((resolve) => {
					finishRead = resolve;
				}),
		);
		const unsubscribe = subscribeBookmarkIcon("slow-read", () => undefined);
		const refresh = refreshBookmarkIcon("slow-read");
		await Promise.resolve();
		unsubscribe();

		finishRead?.({ "icon-slow-read": { icon: "stale.svg" } });
		await refresh;

		expect(getBookmarkIconSnapshot("slow-read", "fallback.svg")).toBe(
			"fallback.svg",
		);
	});

	test("does not cache a failed read after the final unsubscribe", async () => {
		let failRead: ((error: Error) => void) | undefined;
		getStoredIcons.mockImplementationOnce(
			() =>
				new Promise<Record<string, unknown>>((_resolve, reject) => {
					failRead = reject;
				}),
		);
		const consoleError = spyOn(console, "error").mockImplementation(
			() => undefined,
		);
		const unsubscribe = subscribeBookmarkIcon(
			"failed-slow-read",
			() => undefined,
		);
		const refresh = refreshBookmarkIcon("failed-slow-read");
		await Promise.resolve();
		unsubscribe();

		failRead?.(new Error("late failure"));
		await refresh;

		expect(getBookmarkIconSnapshot("failed-slow-read")).toBeNull();
		expect(consoleError).toHaveBeenCalledTimes(1);
		consoleError.mockRestore();
	});
});

describe("getFileIcon", () => {
	const installRuntimeUrlMock = () => {
		const getURL = mock((name: string) => `extension://${name}`);
		globalThis.chrome = {
			runtime: { getURL },
		} as unknown as typeof chrome;

		return getURL;
	};

	test("returns null for web bookmarks without consulting the runtime", () => {
		const getURL = installRuntimeUrlMock();

		expect(getFileIcon("https://example.com/report.pdf")).toBeNull();
		expect(getURL).not.toHaveBeenCalled();
	});

	test.each([
		["file:///tmp/report.PDF", "pdf-file.svg"],
		["file:///tmp/report.doc", "doc-document-docx.svg"],
		["file:///tmp/report.docx", "doc-document-docx.svg"],
		["file:///tmp/sheet.xls", "xls.svg"],
		["file:///tmp/sheet.xlsx", "xls.svg"],
		["file:///tmp/slides.ppt", "ppt.svg"],
		["file:///tmp/slides.pptx", "ppt.svg"],
		["file:///tmp/photo.jpg", "image.svg"],
		["file:///tmp/photo.jpeg", "image.svg"],
		["file:///tmp/photo.png", "image.svg"],
		["file:///tmp/photo.gif", "image.svg"],
		["file:///tmp/photo.bmp", "image.svg"],
		["file:///tmp/vector.svg", "svg.svg"],
		["file:///tmp/song.mp3", "audio-file.svg"],
		["file:///tmp/song.wav", "audio-file.svg"],
		["file:///tmp/song.aac", "audio-file.svg"],
		["file:///tmp/song.flac", "audio-file.svg"],
		["file:///tmp/movie.mp4", "video-file.svg"],
		["file:///tmp/movie.avi", "video-file.svg"],
		["file:///tmp/archive.zip", "file-broken.svg"],
	])("maps %s to the correct bundled asset", (url, asset) => {
		installRuntimeUrlMock();

		expect(getFileIcon(url)).toBe(`extension://assets/svg/${asset}`);
	});

	test("falls back safely for malformed and extensionless file URLs", () => {
		installRuntimeUrlMock();

		expect(getFileIcon("file://%invalid")).toBe(
			"extension://assets/svg/file-broken.svg",
		);
		expect(getFileIcon("file:///tmp/README")).toBe(
			"extension://assets/svg/file-broken.svg",
		);
		expect(getFileIcon("FILE:///tmp/report.pdf")).toBe(
			"extension://assets/svg/pdf-file.svg",
		);
	});
});
