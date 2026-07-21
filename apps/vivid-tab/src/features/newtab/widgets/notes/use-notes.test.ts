import {
	afterEach,
	beforeEach,
	describe,
	expect,
	jest,
	mock,
	test,
} from "@test/jest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { Note } from "./notes-model";
import { NOTES_STORAGE_KEY } from "./notes-storage";
import { useNotes } from "./use-notes";

type StorageListener = (
	changes: Record<string, chrome.storage.StorageChange>,
	areaName: string,
) => void;

const listeners = new Set<StorageListener>();
const localGet = mock(async () => ({}));
const localSet = mock(async (_values: Record<string, unknown>) => undefined);
const syncGet = mock(async () => ({}));
const syncRemove = mock(async () => undefined);

const emitStorageChange = (newValue: unknown, areaName = "local") => {
	for (const listener of listeners) {
		listener({ [NOTES_STORAGE_KEY]: { newValue } }, areaName);
	}
};

beforeEach(() => {
	jest.useRealTimers();
	listeners.clear();
	localGet.mockReset();
	localGet.mockResolvedValue({});
	localSet.mockReset();
	localSet.mockResolvedValue(undefined);
	syncGet.mockReset();
	syncGet.mockResolvedValue({});
	syncRemove.mockReset();
	syncRemove.mockResolvedValue(undefined);
	globalThis.chrome = {
		storage: {
			local: { get: localGet, set: localSet },
			onChanged: {
				addListener: (listener: StorageListener) => listeners.add(listener),
				removeListener: (listener: StorageListener) =>
					listeners.delete(listener),
			},
			sync: { get: syncGet, remove: syncRemove },
		},
	} as unknown as typeof chrome;
});

afterEach(() => {
	cleanup();
	jest.useRealTimers();
	mock.restore();
});

describe("useNotes", () => {
	test("hydrates, adds, sorts, persists, and deletes notes", async () => {
		const stored: Note[] = [{ createdAt: 100, id: 100, text: "Stored" }];
		localGet.mockResolvedValue({
			[NOTES_STORAGE_KEY]: JSON.stringify(stored),
		});
		jest.useFakeTimers();
		jest.setSystemTime(200);
		const { result } = renderHook(() => useNotes());

		await act(async () => Promise.resolve());
		expect(result.current.notes).toEqual(stored);

		act(() => {
			result.current.setDraft("New note");
		});
		expect(result.current.draft).toBe("New note");
		act(() => result.current.addNote());
		expect(result.current.draft).toBe("");
		expect(result.current.notes.map(({ id }) => id)).toEqual([200, 100]);
		await act(async () => Promise.resolve());
		const write = localSet.mock.calls.at(-1)?.[0] as Record<string, string>;
		expect(JSON.parse(write[NOTES_STORAGE_KEY])).toEqual([
			...stored,
			{ createdAt: 200, id: 200, text: "New note" },
		]);

		act(() => result.current.deleteNote(100));
		expect(result.current.notes.map(({ id }) => id)).toEqual([200]);
		await act(async () => Promise.resolve());
		expect(localSet).toHaveBeenCalledTimes(2);
	});

	test("ignores blank additions and nonexistent deletions", async () => {
		const { result } = renderHook(() => useNotes());
		await act(async () => Promise.resolve());

		act(() => result.current.setDraft(" \n "));
		act(() => result.current.addNote());
		act(() => result.current.deleteNote(999));
		expect(result.current.notes).toEqual([]);
		expect(localSet).not.toHaveBeenCalled();
	});

	test("reconciles only relevant local storage changes", async () => {
		const { result } = renderHook(() => useNotes());
		await act(async () => Promise.resolve());
		const external: Note[] = [{ createdAt: 300, id: 300, text: "Other tab" }];

		act(() => emitStorageChange(JSON.stringify(external), "sync"));
		expect(result.current.notes).toEqual([]);

		act(() => emitStorageChange(JSON.stringify(external)));
		expect(result.current.notes).toEqual(external);
		expect(localSet).not.toHaveBeenCalled();

		act(() => emitStorageChange("malformed"));
		expect(result.current.notes).toEqual([]);
	});

	test("does not let late hydration overwrite a local note", async () => {
		let resolveStorage: ((value: Record<string, unknown>) => void) | undefined;
		localGet.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					resolveStorage = resolve;
				}),
		);
		jest.useFakeTimers();
		jest.setSystemTime(500);
		const { result } = renderHook(() => useNotes());

		act(() => result.current.setDraft("Local"));
		act(() => result.current.addNote());
		await act(async () => {
			resolveStorage?.({
				[NOTES_STORAGE_KEY]: JSON.stringify([
					{ createdAt: 1, id: 1, text: "Stale" },
				]),
			});
			await Promise.resolve();
		});

		expect(result.current.notes.map(({ text }) => text)).toEqual(["Local"]);
	});

	test("ignores hydration that resolves after unmount", async () => {
		let resolveStorage: ((value: Record<string, unknown>) => void) | undefined;
		localGet.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					resolveStorage = resolve;
				}),
		);
		const { unmount } = renderHook(() => useNotes());

		expect(listeners.size).toBe(1);
		unmount();
		expect(listeners.size).toBe(0);

		await act(async () => {
			resolveStorage?.({
				[NOTES_STORAGE_KEY]: JSON.stringify([
					{ createdAt: 1, id: 1, text: "Late" },
				]),
			});
			await Promise.resolve();
		});

		expect(localSet).not.toHaveBeenCalled();
	});

	test("reports load and save failures and removes its listener", async () => {
		localGet.mockRejectedValueOnce(new Error("read failed"));
		const errorLog = jest
			.spyOn(console, "error")
			.mockImplementation(() => undefined);
		const { result, unmount } = renderHook(() => useNotes());

		await waitFor(() => expect(errorLog).toHaveBeenCalledTimes(1));
		expect(listeners.size).toBe(1);

		localSet.mockRejectedValueOnce(new Error("write failed"));
		act(() => result.current.setDraft("Note"));
		act(() => result.current.addNote());
		await waitFor(() => expect(errorLog).toHaveBeenCalledTimes(2));

		unmount();
		expect(listeners.size).toBe(0);
		errorLog.mockRestore();
	});
});
