import * as z from "zod/mini";

const NoteSchema = z.object({
	id: z.number(),
	text: z.string(),
	createdAt: z.number(),
});

const NotesSchema = z.array(NoteSchema);

export type Note = z.infer<typeof NoteSchema>;

/**
 * Parses the unknown value read from extension storage.
 *
 * Notes are stored as JSON for compatibility with previous releases. A
 * malformed payload is treated as an empty list so invalid storage data never
 * reaches the UI.
 */
export const parseStoredNotes = (value: unknown): Note[] => {
	if (typeof value !== "string") {
		return [];
	}

	try {
		const result = z.safeParse(NotesSchema, JSON.parse(value));

		return result.success ? result.data : [];
	} catch {
		return [];
	}
};

/** Returns a new array ordered from newest to oldest. */
export const sortNotesByNewest = (notes: readonly Note[]): Note[] =>
	[...notes].sort((first, second) => second.createdAt - first.createdAt);

export const appendNote = (
	notes: readonly Note[],
	text: string,
	createdAt: number,
): Note[] => [
	...notes,
	{
		id: createdAt,
		text,
		createdAt,
	},
];

export const removeNote = (notes: readonly Note[], id: number): Note[] =>
	notes.filter((note) => note.id !== id);
