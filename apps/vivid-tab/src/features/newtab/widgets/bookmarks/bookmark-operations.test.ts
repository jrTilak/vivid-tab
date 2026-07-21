import { beforeEach, describe, expect, mock, spyOn, test } from "@test/jest";
import { deleteBookmark, moveBookmark } from "./bookmark-operations";

let runtimeError: { message: string } | undefined;
let moveError: { message: string } | undefined;
let removeError: { message: string } | undefined;
let storageError: { message: string } | undefined;

const move = mock(
	(
		_id: string,
		_destination: chrome.bookmarks.MoveDestination,
		callback: () => void,
	) => {
		runtimeError = moveError;
		callback();
		runtimeError = undefined;
	},
);
const remove = mock((_id: string, callback: () => void) => {
	runtimeError = removeError;
	callback();
	runtimeError = undefined;
});
const removeTree = mock((_id: string, callback: () => void) => {
	runtimeError = removeError;
	callback();
	runtimeError = undefined;
});
const removeStorage = mock((_keys: string | string[], callback: () => void) => {
	runtimeError = storageError;
	callback();
	runtimeError = undefined;
});

beforeEach(() => {
	runtimeError = undefined;
	moveError = undefined;
	removeError = undefined;
	storageError = undefined;
	move.mockClear();
	remove.mockClear();
	removeTree.mockClear();
	removeStorage.mockClear();

	globalThis.chrome = {
		bookmarks: { move, remove, removeTree },
		runtime: {
			get lastError() {
				return runtimeError;
			},
		},
		storage: { local: { remove: removeStorage } },
	} as unknown as typeof chrome;
});

describe("bookmark operations", () => {
	test("moves a bookmark and rejects Chrome runtime failures", async () => {
		await moveBookmark("bookmark", { index: 2, parentId: "folder" });
		expect(move).toHaveBeenCalledWith(
			"bookmark",
			{ index: 2, parentId: "folder" },
			expect.any(Function),
		);

		moveError = { message: "move failed" };
		await expect(moveBookmark("bookmark", { index: 0 })).rejects.toThrow(
			"move failed",
		);
	});

	test("deletes URL nodes and their current and legacy icon keys", async () => {
		await deleteBookmark("bookmark", {
			isFolder: false,
			url: "https://example.com",
		});

		expect(remove).toHaveBeenCalledWith("bookmark", expect.any(Function));
		expect(removeTree).not.toHaveBeenCalled();
		expect(removeStorage).toHaveBeenCalledWith(
			["icon-bookmark", "favicon-https://example.com"],
			expect.any(Function),
		);
	});

	test("recursively deletes folders without a URL cache key", async () => {
		await deleteBookmark("folder", { isFolder: true });

		expect(removeTree).toHaveBeenCalledWith("folder", expect.any(Function));
		expect(remove).not.toHaveBeenCalled();
		expect(removeStorage).toHaveBeenCalledWith(
			["icon-folder"],
			expect.any(Function),
		);
	});

	test("does not clean cache when browser deletion fails", async () => {
		removeError = { message: "protected node" };

		await expect(
			deleteBookmark("bookmark", { isFolder: false }),
		).rejects.toThrow("protected node");
		expect(removeStorage).not.toHaveBeenCalled();
	});

	test("keeps a successful deletion when cache cleanup fails", async () => {
		storageError = { message: "cache unavailable" };
		const warn = spyOn(console, "warn").mockImplementation(() => undefined);

		await expect(
			deleteBookmark("bookmark", { isFolder: false }),
		).resolves.toBeUndefined();
		expect(warn).toHaveBeenCalledTimes(1);
		warn.mockRestore();
	});
});
