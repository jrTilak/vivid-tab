import { appendNote, type Note, removeNote } from "./notes-model";

export type NotesState = {
	draft: string;
	notes: Note[];
	revision: number;
};

export type NotesAction =
	| { type: "draft-changed"; draft: string }
	| { type: "external-notes"; notes: Note[] }
	| { type: "hydrated"; notes: Note[] }
	| { type: "note-added"; createdAt: number }
	| { type: "note-deleted"; id: number };

export const INITIAL_NOTES_STATE: NotesState = {
	draft: "",
	notes: [],
	revision: 0,
};

export const areNotesEqual = (
	currentNotes: readonly Note[],
	nextNotes: readonly Note[],
) =>
	currentNotes.length === nextNotes.length &&
	currentNotes.every((note, index) => {
		const nextNote = nextNotes[index];

		return (
			nextNote?.id === note.id &&
			nextNote.text === note.text &&
			nextNote.createdAt === note.createdAt
		);
	});

/** Keeps persisted and local note changes deterministic outside React. */
export const notesReducer = (
	state: NotesState,
	action: NotesAction,
): NotesState => {
	switch (action.type) {
		case "draft-changed":
			return action.draft === state.draft
				? state
				: { ...state, draft: action.draft };
		case "hydrated":
			// Keep local edits if storage resolves after the user creates a note.
			return state.revision === 0 ? { ...state, notes: action.notes } : state;
		case "external-notes":
			return areNotesEqual(state.notes, action.notes)
				? state
				: { ...state, notes: action.notes, revision: 0 };
		case "note-added":
			if (!state.draft.trim()) return state;

			return {
				draft: "",
				notes: appendNote(state.notes, state.draft, action.createdAt),
				revision: state.revision + 1,
			};
		case "note-deleted": {
			const notes = removeNote(state.notes, action.id);
			if (notes.length === state.notes.length) return state;

			return {
				...state,
				notes,
				revision: state.revision + 1,
			};
		}
	}
};
