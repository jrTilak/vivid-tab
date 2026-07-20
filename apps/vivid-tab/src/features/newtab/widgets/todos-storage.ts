import * as z from "zod/mini";
import type { Todo } from "./todos-model";

export const TODOS_STORAGE_KEY = "todos";

const StoredTodoSchema = z.object({
	completed: z.boolean(),
	completedAt: z.optional(z.nullable(z.number())),
	id: z.number(),
	text: z.string(),
});

export interface ParsedStoredTodos {
	shouldPersist: boolean;
	todos: Todo[];
}

const invalidStoredTodos = (): ParsedStoredTodos => ({
	shouldPersist: true,
	todos: [],
});

/**
 * Parses persisted data as untrusted input and upgrades legacy todos that did
 * not record a completion timestamp. Invalid entries are removed without
 * discarding the rest of the list.
 */
export const parseStoredTodos = (storedValue: unknown): ParsedStoredTodos => {
	if (storedValue === undefined) {
		return { shouldPersist: false, todos: [] };
	}

	if (typeof storedValue !== "string") return invalidStoredTodos();

	let parsedValue: unknown;

	try {
		parsedValue = JSON.parse(storedValue);
	} catch {
		return invalidStoredTodos();
	}

	if (!Array.isArray(parsedValue)) return invalidStoredTodos();

	const todos: Todo[] = [];

	for (const candidate of parsedValue) {
		const result = z.safeParse(StoredTodoSchema, candidate);

		if (!result.success) continue;

		const { completed, completedAt, id, text } = result.data;
		todos.push(
			completed
				? {
						completed: true,
						completedAt: completedAt ?? id,
						id,
						text,
					}
				: { completed: false, completedAt: null, id, text },
		);
	}

	return {
		shouldPersist: JSON.stringify(todos) !== JSON.stringify(parsedValue),
		todos,
	};
};

export const loadTodos = async (): Promise<ParsedStoredTodos> => {
	const localData = await chrome.storage.local.get(TODOS_STORAGE_KEY);
	if (localData[TODOS_STORAGE_KEY] !== undefined) {
		return parseStoredTodos(localData[TODOS_STORAGE_KEY]);
	}

	const syncData = await chrome.storage.sync.get(TODOS_STORAGE_KEY);
	const legacyTodos = syncData[TODOS_STORAGE_KEY];
	if (legacyTodos === undefined) return parseStoredTodos(undefined);

	const parsed = parseStoredTodos(legacyTodos);
	await chrome.storage.local.set({
		[TODOS_STORAGE_KEY]: JSON.stringify(parsed.todos),
	});
	await chrome.storage.sync.remove(TODOS_STORAGE_KEY);

	return { shouldPersist: false, todos: parsed.todos };
};

export const saveTodos = (todos: readonly Todo[]) =>
	chrome.storage.local.set({
		[TODOS_STORAGE_KEY]: JSON.stringify(todos),
	});
