import { beforeEach, describe, expect, mock, test } from "@test/jest";
import type { Note } from "./notes-model";
import {
	NOTES_STORAGE_KEY,
	readStoredNotes,
	writeStoredNotes,
} from "./notes-storage";

const notes: Note[] = [{ createdAt: 100, id: 100, text: "Remember" }];
const localGet = mock(async () => ({}));
const localSet = mock(async (_values: Record<string, unknown>) => undefined);
const syncGet = mock(async () => ({}));
const syncRemove = mock(async () => undefined);

beforeEach(() => {
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
			sync: { get: syncGet, remove: syncRemove },
		},
	} as unknown as typeof chrome;
});

describe("notes storage", () => {
	test("loads local notes without reading legacy sync storage", async () => {
		localGet.mockResolvedValue({
			[NOTES_STORAGE_KEY]: JSON.stringify(notes),
		});

		expect(await readStoredNotes()).toEqual(notes);
		expect(localGet).toHaveBeenCalledWith(NOTES_STORAGE_KEY);
		expect(syncGet).not.toHaveBeenCalled();
	});

	test("treats an invalid local payload as empty", async () => {
		localGet.mockResolvedValue({ [NOTES_STORAGE_KEY]: "invalid" });

		expect(await readStoredNotes()).toEqual([]);
		expect(syncGet).not.toHaveBeenCalled();
	});

	test("returns empty when neither storage area contains notes", async () => {
		expect(await readStoredNotes()).toEqual([]);
		expect(localSet).not.toHaveBeenCalled();
		expect(syncRemove).not.toHaveBeenCalled();
	});

	test("migrates legacy sync notes into local storage", async () => {
		syncGet.mockResolvedValue({
			[NOTES_STORAGE_KEY]: JSON.stringify(notes),
		});

		expect(await readStoredNotes()).toEqual(notes);
		const migrated = localSet.mock.calls[0]?.[0] as Record<string, string>;
		expect(JSON.parse(migrated[NOTES_STORAGE_KEY])).toEqual(notes);
		expect(syncRemove).toHaveBeenCalledWith(NOTES_STORAGE_KEY);
	});

	test("normalizes malformed legacy data before migration", async () => {
		syncGet.mockResolvedValue({ [NOTES_STORAGE_KEY]: "not-json" });

		expect(await readStoredNotes()).toEqual([]);
		expect(localSet).toHaveBeenCalledWith({ [NOTES_STORAGE_KEY]: "[]" });
		expect(syncRemove).toHaveBeenCalledWith(NOTES_STORAGE_KEY);
	});

	test("serializes writes and propagates storage failures", async () => {
		await writeStoredNotes(notes);
		expect(localSet).toHaveBeenCalledWith({
			[NOTES_STORAGE_KEY]: JSON.stringify(notes),
		});

		localSet.mockRejectedValueOnce(new Error("quota exceeded"));
		expect(writeStoredNotes(notes)).rejects.toThrow("quota exceeded");
	});
});
