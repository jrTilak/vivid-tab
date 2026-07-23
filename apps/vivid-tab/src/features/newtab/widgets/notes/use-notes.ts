import { useCallback, useEffect, useMemo, useReducer } from "react";
import { parseStoredNotes, sortNotesByNewest } from "./notes-model";
import { INITIAL_NOTES_STATE, notesReducer } from "./notes-state";
import {
	NOTES_STORAGE_KEY,
	readStoredNotes,
	writeStoredNotes,
} from "./notes-storage";

export const useNotes = () => {
	const [state, dispatch] = useReducer(notesReducer, INITIAL_NOTES_STATE);

	useEffect(() => {
		let isActive = true;

		readStoredNotes()
			.then((notes) => {
				if (isActive) {
					dispatch({ type: "hydrated", notes });
				}
			})
			.catch((error: unknown) => {
				console.error("Unable to load notes", error);
			});

		return () => {
			isActive = false;
		};
	}, []);

	useEffect(() => {
		const storageChanges = chrome.storage.onChanged;
		const handleStorageChange = (
			changes: Record<string, chrome.storage.StorageChange>,
			areaName: string,
		) => {
			if (areaName !== "local" || !changes[NOTES_STORAGE_KEY]) return;

			dispatch({
				notes: parseStoredNotes(changes[NOTES_STORAGE_KEY].newValue),
				type: "external-notes",
			});
		};

		storageChanges.addListener(handleStorageChange);

		return () => storageChanges.removeListener(handleStorageChange);
	}, []);

	useEffect(() => {
		if (state.revision === 0) {
			return;
		}

		writeStoredNotes(state.notes).catch((error: unknown) => {
			console.error("Unable to save notes", error);
		});
	}, [state.notes, state.revision]);

	const setDraft = useCallback((draft: string) => {
		dispatch({ type: "draft-changed", draft });
	}, []);

	const addNote = useCallback(() => {
		dispatch({ type: "note-added", createdAt: Date.now() });
	}, []);

	const deleteNote = useCallback((id: number) => {
		dispatch({ type: "note-deleted", id });
	}, []);

	const notes = useMemo(() => sortNotesByNewest(state.notes), [state.notes]);

	return {
		addNote,
		deleteNote,
		draft: state.draft,
		notes,
		setDraft,
	};
};
