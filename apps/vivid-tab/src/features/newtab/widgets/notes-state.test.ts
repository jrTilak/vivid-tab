import { describe, expect, test } from "@test/jest";
import type { Note } from "./notes-model";
import {
	areNotesEqual,
	INITIAL_NOTES_STATE,
	notesReducer,
} from "./notes-state";

const storedNotes: Note[] = [{ createdAt: 100, id: 100, text: "Stored" }];

describe("notes state", () => {
	test("hydrates only before a local edit wins the race", () => {
		const hydrated = notesReducer(INITIAL_NOTES_STATE, {
			notes: storedNotes,
			type: "hydrated",
		});
		expect(hydrated.notes).toBe(storedNotes);

		const edited = { ...hydrated, revision: 1 };
		expect(notesReducer(edited, { notes: [], type: "hydrated" })).toBe(edited);
	});

	test("ignores blank notes and records non-empty drafts", () => {
		const blank = { ...INITIAL_NOTES_STATE, draft: "  \n" };
		expect(notesReducer(blank, { createdAt: 200, type: "note-added" })).toBe(
			blank,
		);

		const drafted = notesReducer(INITIAL_NOTES_STATE, {
			draft: "A note",
			type: "draft-changed",
		});
		const added = notesReducer(drafted, {
			createdAt: 200,
			type: "note-added",
		});
		expect(added).toEqual({
			draft: "",
			notes: [{ createdAt: 200, id: 200, text: "A note" }],
			revision: 1,
		});
	});

	test("avoids revisions for no-op draft and delete actions", () => {
		const state = { ...INITIAL_NOTES_STATE, notes: storedNotes };

		expect(notesReducer(state, { draft: "", type: "draft-changed" })).toBe(
			state,
		);
		expect(notesReducer(state, { id: 999, type: "note-deleted" })).toBe(state);

		const deleted = notesReducer(state, {
			id: 100,
			type: "note-deleted",
		});
		expect(deleted.notes).toEqual([]);
		expect(deleted.revision).toBe(1);
	});

	test("reconciles changed external values but preserves equal state", () => {
		const state = { ...INITIAL_NOTES_STATE, notes: storedNotes, revision: 2 };
		const equivalent = storedNotes.map((note) => ({ ...note }));

		expect(areNotesEqual(storedNotes, equivalent)).toBe(true);
		expect(
			notesReducer(state, { notes: equivalent, type: "external-notes" }),
		).toBe(state);

		const changed = [{ ...storedNotes[0], text: "Changed" }];
		const reconciled = notesReducer(state, {
			notes: changed,
			type: "external-notes",
		});
		expect(reconciled.notes).toBe(changed);
		expect(reconciled.revision).toBe(0);
		expect(areNotesEqual(storedNotes, [])).toBe(false);
	});
});
