import {
	afterEach,
	beforeEach,
	describe,
	expect,
	mock,
	spyOn,
	test,
} from "@test/jest";
import {
	BOOKMARK_ICON_UPDATE_EVENT,
	loadBookmarkIcon,
	parseStoredBookmarkIcon,
	persistBookmarkIcon,
	readIconFile,
	saveBookmark,
	saveBookmarkFolder,
} from "./bookmark-editor-service";

type Operation =
	| "create"
	| "get"
	| "remove"
	| "removeStorage"
	| "set"
	| "update";

let runtimeError: { message: string } | undefined;
let failingOperation: Operation | undefined;
const storageValues: Record<string, unknown> = {};

const runCallback = (operation: Operation, callback: () => void) => {
	runtimeError =
		failingOperation === operation
			? { message: `${operation} failed` }
			: undefined;
	callback();
	runtimeError = undefined;
};

const create = mock(
	(
		details: chrome.bookmarks.CreateDetails,
		callback: (bookmark: chrome.bookmarks.BookmarkTreeNode) => void,
	) =>
		runCallback("create", () =>
			callback({
				id: "created",
				index: 0,
				syncing: false,
				title: details.title,
			}),
		),
);
const update = mock(
	(
		id: string,
		changes: chrome.bookmarks.UpdateChanges,
		callback: (bookmark: chrome.bookmarks.BookmarkTreeNode) => void,
	) =>
		runCallback("update", () =>
			callback({ id, index: 0, syncing: false, title: changes.title ?? "" }),
		),
);
const remove = mock((_id: string, callback: () => void) =>
	runCallback("remove", callback),
);
const getStorage = mock(
	(key: string, callback: (items: Record<string, unknown>) => void) =>
		runCallback("get", () => callback({ [key]: storageValues[key] })),
);
const setStorage = mock(
	(values: Record<string, unknown>, callback: () => void) =>
		runCallback("set", () => {
			Object.assign(storageValues, values);
			callback();
		}),
);
const removeStorage = mock((key: string, callback: () => void) =>
	runCallback("removeStorage", () => {
		delete storageValues[key];
		callback();
	}),
);
const handleIconUpdate = mock((_event: Event) => undefined);

beforeEach(() => {
	runtimeError = undefined;
	failingOperation = undefined;
	for (const key of Object.keys(storageValues)) delete storageValues[key];
	create.mockClear();
	update.mockClear();
	remove.mockClear();
	getStorage.mockClear();
	setStorage.mockClear();
	removeStorage.mockClear();
	handleIconUpdate.mockClear();
	window.addEventListener(BOOKMARK_ICON_UPDATE_EVENT, handleIconUpdate);

	globalThis.chrome = {
		bookmarks: { create, remove, update },
		runtime: {
			get lastError() {
				return runtimeError;
			},
		},
		storage: {
			local: { get: getStorage, remove: removeStorage, set: setStorage },
		},
	} as unknown as typeof chrome;
});

afterEach(() => {
	Reflect.deleteProperty(globalThis, "FileReader");
	window.removeEventListener(BOOKMARK_ICON_UPDATE_EVENT, handleIconUpdate);
});

describe("bookmark icon parsing and files", () => {
	test("accepts only non-empty string icons from storage", () => {
		expect(parseStoredBookmarkIcon({ icon: "data:image/png;base64,abc" })).toBe(
			"data:image/png;base64,abc",
		);
		expect(parseStoredBookmarkIcon({ icon: "" })).toBeNull();
		expect(parseStoredBookmarkIcon({ icon: 12 })).toBeNull();
		expect(parseStoredBookmarkIcon(null)).toBeNull();
	});

	test("rejects a non-image before invoking FileReader", async () => {
		const file = new File(["plain text"], "notes.txt", { type: "text/plain" });

		await expect(readIconFile(file)).rejects.toThrow("not an image");
	});

	test("resolves a converted image and reports reader errors", async () => {
		class SuccessfulReader {
			error: Error | null = null;
			onabort: (() => void) | null = null;
			onerror: (() => void) | null = null;
			onload: (() => void) | null = null;
			result: string | ArrayBuffer | null = null;

			readAsDataURL() {
				this.result = "data:image/png;base64,abc";
				this.onload?.();
			}
		}
		globalThis.FileReader = SuccessfulReader as unknown as typeof FileReader;

		await expect(
			readIconFile(new File(["image"], "icon.png", { type: "image/png" })),
		).resolves.toBe("data:image/png;base64,abc");

		class FailedReader extends SuccessfulReader {
			override error = new Error("reader failed");
			override readAsDataURL() {
				this.onerror?.();
			}
		}
		globalThis.FileReader = FailedReader as unknown as typeof FileReader;

		await expect(
			readIconFile(new File(["image"], "icon.png", { type: "image/png" })),
		).rejects.toThrow("reader failed");
	});

	test("reports aborted and non-string file conversions", async () => {
		class AbortedReader {
			error: Error | null = null;
			onabort: (() => void) | null = null;
			onerror: (() => void) | null = null;
			onload: (() => void) | null = null;
			result: string | ArrayBuffer | null = null;

			readAsDataURL() {
				this.onabort?.();
			}
		}
		globalThis.FileReader = AbortedReader as unknown as typeof FileReader;
		const file = new File(["image"], "icon.png", { type: "image/png" });

		await expect(readIconFile(file)).rejects.toThrow("cancelled");

		class BinaryReader extends AbortedReader {
			override result: string | ArrayBuffer | null = new ArrayBuffer(1);
			override readAsDataURL() {
				this.onload?.();
			}
		}
		globalThis.FileReader = BinaryReader as unknown as typeof FileReader;
		await expect(readIconFile(file)).rejects.toThrow("could not be converted");
	});

	test("uses a readable fallback when FileReader has no error detail", async () => {
		class FailedReader {
			error: Error | null = null;
			onabort: (() => void) | null = null;
			onerror: (() => void) | null = null;
			onload: (() => void) | null = null;
			result: string | ArrayBuffer | null = null;

			readAsDataURL() {
				this.onerror?.();
			}
		}
		globalThis.FileReader = FailedReader as unknown as typeof FileReader;

		await expect(
			readIconFile(new File(["image"], "icon.png", { type: "image/png" })),
		).rejects.toThrow("Could not read the selected image");
	});
});

describe("bookmark icon storage", () => {
	test("loads validated icon storage and forwards read errors", async () => {
		storageValues["icon-bookmark"] = { icon: "data:image/png;base64,abc" };
		await expect(loadBookmarkIcon("bookmark")).resolves.toBe(
			"data:image/png;base64,abc",
		);

		failingOperation = "get";
		await expect(loadBookmarkIcon("bookmark")).rejects.toThrow("get failed");
	});

	test("stores, removes, and broadcasts explicit icon changes", async () => {
		await persistBookmarkIcon("bookmark", "data:image/png;base64,abc");
		expect(setStorage).toHaveBeenCalledWith(
			{ "icon-bookmark": { icon: "data:image/png;base64,abc" } },
			expect.any(Function),
		);
		expect(handleIconUpdate).toHaveBeenCalledTimes(1);

		await persistBookmarkIcon("bookmark", null);
		expect(removeStorage).toHaveBeenCalledWith(
			"icon-bookmark",
			expect.any(Function),
		);
		expect(handleIconUpdate).toHaveBeenCalledTimes(2);
	});

	test("preserves storage when an icon was not loaded", async () => {
		await persistBookmarkIcon("bookmark", undefined);

		expect(setStorage).not.toHaveBeenCalled();
		expect(removeStorage).not.toHaveBeenCalled();
		expect(handleIconUpdate).not.toHaveBeenCalled();
	});

	test("does not broadcast an icon change when storage fails", async () => {
		failingOperation = "set";

		await expect(
			persistBookmarkIcon("bookmark", "data:image/png;base64,abc"),
		).rejects.toThrow("set failed");
		expect(handleIconUpdate).not.toHaveBeenCalled();
	});

	test("does not broadcast an icon removal when storage cleanup fails", async () => {
		failingOperation = "removeStorage";

		await expect(persistBookmarkIcon("bookmark", null)).rejects.toThrow(
			"removeStorage failed",
		);
		expect(handleIconUpdate).not.toHaveBeenCalled();
	});
});

describe("bookmark editor persistence", () => {
	test("updates an existing bookmark before persisting its icon", async () => {
		await expect(
			saveBookmark({
				bookmarkId: "bookmark",
				icon: null,
				title: "Updated",
				url: "https://example.com",
			}),
		).resolves.toBe("bookmark");
		expect(update).toHaveBeenCalledWith(
			"bookmark",
			{ title: "Updated", url: "https://example.com" },
			expect.any(Function),
		);
		expect(removeStorage).toHaveBeenCalledTimes(1);
	});

	test("creates bookmarks with the requested parent and skips an empty icon", async () => {
		await expect(
			saveBookmark({
				icon: null,
				parentId: "folder",
				title: "Example",
				url: "https://example.com",
			}),
		).resolves.toBe("created");
		expect(create).toHaveBeenCalledWith(
			{
				parentId: "folder",
				title: "Example",
				url: "https://example.com",
			},
			expect.any(Function),
		);
		expect(removeStorage).not.toHaveBeenCalled();
		expect(setStorage).not.toHaveBeenCalled();
	});

	test("does not persist or roll back when the browser mutation fails", async () => {
		failingOperation = "update";
		await expect(
			saveBookmark({
				bookmarkId: "bookmark",
				icon: "data:image/png;base64,abc",
				title: "Updated",
				url: "https://example.com",
			}),
		).rejects.toThrow("update failed");
		expect(setStorage).not.toHaveBeenCalled();
		expect(remove).not.toHaveBeenCalled();

		failingOperation = "create";
		await expect(
			saveBookmark({
				icon: "data:image/png;base64,abc",
				title: "Created",
				url: "https://example.com",
			}),
		).rejects.toThrow("create failed");
		expect(remove).not.toHaveBeenCalled();
	});

	test("rolls back a new bookmark if its icon cannot be persisted", async () => {
		failingOperation = "set";

		await expect(
			saveBookmark({
				icon: "data:image/png;base64,abc",
				title: "Example",
				url: "https://example.com",
			}),
		).rejects.toThrow("set failed");
		expect(remove).toHaveBeenCalledWith("created", expect.any(Function));
	});

	test("preserves the original failure if rollback also fails", async () => {
		failingOperation = "set";
		remove.mockImplementationOnce((_id, callback) => {
			runtimeError = { message: "rollback failed" };
			callback();
			runtimeError = undefined;
		});
		const errorLog = spyOn(console, "error").mockImplementation(
			() => undefined,
		);

		await expect(
			saveBookmark({
				icon: "data:image/png;base64,abc",
				title: "Example",
				url: "https://example.com",
			}),
		).rejects.toThrow("set failed");
		expect(errorLog).toHaveBeenCalledTimes(1);
		errorLog.mockRestore();
	});

	test("creates and updates folders without a URL field", async () => {
		await expect(
			saveBookmarkFolder({
				icon: undefined,
				parentId: "parent",
				title: "Folder",
			}),
		).resolves.toBe("created");
		expect(create).toHaveBeenCalledWith(
			{ parentId: "parent", title: "Folder" },
			expect.any(Function),
		);

		await expect(
			saveBookmarkFolder({
				bookmarkId: "folder",
				icon: undefined,
				title: "Renamed",
			}),
		).resolves.toBe("folder");
		expect(update).toHaveBeenCalledWith(
			"folder",
			{ title: "Renamed" },
			expect.any(Function),
		);
	});

	test("rolls back a new folder if its icon cannot be persisted", async () => {
		failingOperation = "set";

		await expect(
			saveBookmarkFolder({
				icon: "data:image/png;base64,abc",
				title: "Folder",
			}),
		).rejects.toThrow("set failed");
		expect(remove).toHaveBeenCalledWith("created", expect.any(Function));
	});

	test("preserves a folder icon failure if rollback also fails", async () => {
		failingOperation = "set";
		remove.mockImplementationOnce((_id, callback) => {
			runtimeError = { message: "rollback failed" };
			callback();
			runtimeError = undefined;
		});
		const errorLog = spyOn(console, "error").mockImplementation(
			() => undefined,
		);

		await expect(
			saveBookmarkFolder({
				icon: "data:image/png;base64,abc",
				title: "Folder",
			}),
		).rejects.toThrow("set failed");
		expect(errorLog).toHaveBeenCalledTimes(1);
		errorLog.mockRestore();
	});
});
