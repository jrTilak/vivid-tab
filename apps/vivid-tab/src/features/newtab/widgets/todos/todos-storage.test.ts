import { beforeEach, describe, expect, mock, test } from "@test/jest";
import type { Todo } from "./todos-model";
import {
	loadTodos,
	parseStoredTodos,
	saveTodos,
	TODOS_STORAGE_KEY,
} from "./todos-storage";

const todos: Todo[] = [
	{ completed: false, completedAt: null, id: 100, text: "Test" },
];
const localGet = mock(async () => ({}));
const localSet = mock(async () => undefined);
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

describe("todo storage parsing", () => {
	test("distinguishes missing, empty, current, and malformed data", () => {
		expect(parseStoredTodos(undefined)).toEqual({
			shouldPersist: false,
			todos: [],
		});
		expect(parseStoredTodos("[]")).toEqual({
			shouldPersist: false,
			todos: [],
		});
		expect(parseStoredTodos(JSON.stringify(todos))).toEqual({
			shouldPersist: false,
			todos,
		});
		expect(parseStoredTodos("null")).toEqual({
			shouldPersist: true,
			todos: [],
		});
	});

	test("normalizes completion timestamps and preserves valid siblings", () => {
		expect(
			parseStoredTodos(
				JSON.stringify([
					{ completed: true, completedAt: null, id: 1, text: "Legacy" },
					{ completed: false, completedAt: 99, id: 2, text: "Open" },
					{ completed: false, id: "bad", text: "Invalid" },
				]),
			),
		).toEqual({
			shouldPersist: true,
			todos: [
				{ completed: true, completedAt: 1, id: 1, text: "Legacy" },
				{ completed: false, completedAt: null, id: 2, text: "Open" },
			],
		});
	});
});

describe("todo storage persistence", () => {
	test("loads local data without consulting sync storage", async () => {
		localGet.mockResolvedValue({
			[TODOS_STORAGE_KEY]: JSON.stringify(todos),
		});

		expect(await loadTodos()).toEqual({ shouldPersist: false, todos });
		expect(syncGet).not.toHaveBeenCalled();
	});

	test("returns an empty non-dirty result when storage is empty", async () => {
		expect(await loadTodos()).toEqual({
			shouldPersist: false,
			todos: [],
		});
		expect(localSet).not.toHaveBeenCalled();
	});

	test("migrates and normalizes legacy sync data once", async () => {
		syncGet.mockResolvedValue({
			[TODOS_STORAGE_KEY]: JSON.stringify([
				{ completed: true, id: 10, text: "Legacy" },
			]),
		});

		expect(await loadTodos()).toEqual({
			shouldPersist: false,
			todos: [{ completed: true, completedAt: 10, id: 10, text: "Legacy" }],
		});
		expect(localSet).toHaveBeenCalledWith({
			[TODOS_STORAGE_KEY]: JSON.stringify([
				{ completed: true, completedAt: 10, id: 10, text: "Legacy" },
			]),
		});
		expect(syncRemove).toHaveBeenCalledWith(TODOS_STORAGE_KEY);
	});

	test("serializes saves and propagates storage failures", async () => {
		await saveTodos(todos);
		expect(localSet).toHaveBeenCalledWith({
			[TODOS_STORAGE_KEY]: JSON.stringify(todos),
		});

		localGet.mockRejectedValueOnce(new Error("storage unavailable"));
		expect(loadTodos()).rejects.toThrow("storage unavailable");
	});
});
