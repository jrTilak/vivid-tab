import { useCallback, useEffect, useMemo, useReducer } from "react";
import {
	appendNote,
	type Note,
	parseStoredNotes,
	removeNote,
	sortNotesByNewest,
} from "./notes-model";
import {
	NOTES_STORAGE_KEY,
	readStoredNotes,
	writeStoredNotes,
} from "./notes-storage";

type NotesState = {
	draft: string;
	notes: Note[];
	revision: number;
};

type NotesAction =
	| { type: "draft-changed"; draft: string }
	| { type: "external-notes"; notes: Note[] }
	| { type: "hydrated"; notes: Note[] }
	| { type: "note-added"; createdAt: number }
	| { type: "note-deleted"; id: number };

const INITIAL_STATE: NotesState = {
	draft: "",
	notes: [],
	revision: 0,
};

const notesReducer = (state: NotesState, action: NotesAction): NotesState => {
	switch (action.type) {
		case "draft-changed":
			return { ...state, draft: action.draft };
		case "hydrated":
			// Keep local edits if storage resolves after the user creates a note.
			return state.revision === 0 ? { ...state, notes: action.notes } : state;
		case "external-notes": {
			const isUnchanged =
				state.notes.length === action.notes.length &&
				state.notes.every((note, index) => {
					const nextNote = action.notes[index];

					return (
						nextNote?.id === note.id &&
						nextNote.text === note.text &&
						nextNote.createdAt === note.createdAt
					);
				});

			return isUnchanged
				? state
				: { ...state, notes: action.notes, revision: 0 };
		}
		case "note-added":
			if (!state.draft.trim()) {
				return state;
			}

			return {
				draft: "",
				notes: appendNote(state.notes, state.draft, action.createdAt),
				revision: state.revision + 1,
			};
		case "note-deleted":
			return {
				...state,
				notes: removeNote(state.notes, action.id),
				revision: state.revision + 1,
			};
	}
};

export const useNotes = () => {
	const [state, dispatch] = useReducer(notesReducer, INITIAL_STATE);

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

		chrome.storage.onChanged.addListener(handleStorageChange);

		return () => chrome.storage.onChanged.removeListener(handleStorageChange);
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
