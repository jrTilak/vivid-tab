import { describe, expect, test } from "@test/jest";
import {
	appendNote,
	parseStoredNotes,
	removeNote,
	sortNotesByNewest,
} from "./notes-model";

const NOTES = [
	{ id: 1, text: "Older", createdAt: 100 },
	{ id: 2, text: "Newer", createdAt: 200 },
];

describe("notes model", () => {
	test("validates notes read from storage", () => {
		expect(parseStoredNotes(JSON.stringify(NOTES))).toEqual(NOTES);
		expect(parseStoredNotes(undefined)).toEqual([]);
		expect(parseStoredNotes("not-json")).toEqual([]);
		expect(
			parseStoredNotes(JSON.stringify([{ id: "invalid", text: "Note" }])),
		).toEqual([]);
	});

	test("sorts without mutating the stored order", () => {
		const original = [...NOTES];
		const sorted = sortNotesByNewest(original);

		expect(sorted.map((note) => note.id)).toEqual([2, 1]);
		expect(original).toEqual(NOTES);
		expect(sorted).not.toBe(original);
	});

	test("adds and removes notes immutably", () => {
		const added = appendNote(NOTES, "Latest", 300);
		const removed = removeNote(added, 1);

		expect(added.at(-1)).toEqual({
			id: 300,
			text: "Latest",
			createdAt: 300,
		});
		expect(removed.map((note) => note.id)).toEqual([2, 300]);
		expect(NOTES).toHaveLength(2);
	});
});
