import { type Note, parseStoredNotes } from "./notes-model";

export const NOTES_STORAGE_KEY = "notes";

export const readStoredNotes = async (): Promise<Note[]> => {
	const localResult = await chrome.storage.local.get(NOTES_STORAGE_KEY);
	if (localResult[NOTES_STORAGE_KEY] !== undefined) {
		return parseStoredNotes(localResult[NOTES_STORAGE_KEY]);
	}

	/**
	 * Notes moved because they can exceed sync's small per-item quota.
	 *
	 * @deprecated Remove this sync-storage migration in v1.5.0.
	 */
	const syncResult = await chrome.storage.sync.get(NOTES_STORAGE_KEY);
	const storedNotes = syncResult[NOTES_STORAGE_KEY];
	if (storedNotes === undefined) return [];

	const notes = parseStoredNotes(storedNotes);
	await chrome.storage.local.set({
		[NOTES_STORAGE_KEY]: JSON.stringify(notes),
	});
	await chrome.storage.sync.remove(NOTES_STORAGE_KEY);

	return notes;
};

export const writeStoredNotes = async (
	notes: readonly Note[],
): Promise<void> => {
	await chrome.storage.local.set({
		[NOTES_STORAGE_KEY]: JSON.stringify(notes),
	});
};
