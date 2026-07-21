import { describe, expect, test } from "@test/jest";
import {
	areTodosEqual,
	createTodo,
	deleteTodo,
	getNearestExpirationDelay,
	removeExpiredTodos,
	sortTodos,
	type Todo,
	toggleTodo,
} from "./todos-model";
import { parseStoredTodos } from "./todos-storage";

describe("todo model", () => {
	test("records when a todo is completed and clears it when reopened", () => {
		const todo = createTodo("Test the extension", 100);
		const completed = toggleTodo([todo], todo.id, 500)[0];

		expect(completed).toEqual({
			completed: true,
			completedAt: 500,
			id: 100,
			text: "Test the extension",
		});
		expect(toggleTodo([completed], todo.id, 900)[0]).toEqual(todo);
	});

	test("expires from completion time and selects the nearest deadline", () => {
		const todos: Todo[] = [
			{ completed: true, completedAt: 1_000, id: 10, text: "First" },
			{ completed: true, completedAt: 2_000, id: 20, text: "Second" },
			{ completed: false, completedAt: null, id: 30, text: "Active" },
		];

		expect(getNearestExpirationDelay(todos, 1, 30_000)).toBe(31_000);
		expect(removeExpiredTodos(todos, 1, 61_000)).toEqual([todos[1], todos[2]]);
	});

	test("sorts without mutating the stored order", () => {
		const todos: Todo[] = [
			{ completed: true, completedAt: 40, id: 4, text: "Completed" },
			{ completed: false, completedAt: null, id: 2, text: "Older" },
			{ completed: false, completedAt: null, id: 3, text: "Newer" },
		];
		const originalOrder = todos.slice();

		expect(sortTodos(todos).map(({ id }) => id)).toEqual([3, 2, 4]);
		expect(todos).toEqual(originalOrder);
	});

	test("preserves array identity for missing update targets", () => {
		const todos: Todo[] = [createTodo("Keep", 1)];

		expect(deleteTodo(todos, 999)).toBe(todos);
		expect(toggleTodo(todos, 999, 500)).toBe(todos);
		expect(deleteTodo(todos, 1)).toEqual([]);
	});

	test("handles expiration boundaries and negative durations", () => {
		const completed: Todo = {
			completed: true,
			completedAt: 1_000,
			id: 1,
			text: "Done",
		};

		expect(removeExpiredTodos([completed], 1, 60_999)).toHaveLength(1);
		expect(removeExpiredTodos([completed], 1, 61_000)).toEqual([]);
		expect(removeExpiredTodos([completed], -5, 1_000)).toEqual([]);
		expect(getNearestExpirationDelay([], 1, 0)).toBeNull();
		expect(getNearestExpirationDelay([completed], 0, 2_000)).toBe(0);
	});

	test("compares all fields used by external storage reconciliation", () => {
		const todos: Todo[] = [createTodo("Same", 1)];

		expect(areTodosEqual(todos, [{ ...todos[0] }])).toBe(true);
		expect(areTodosEqual(todos, [])).toBe(false);
		expect(areTodosEqual(todos, [createTodo("Changed", 1)])).toBe(false);
	});
});

describe("todo storage", () => {
	test("migrates legacy completion data and removes invalid entries", () => {
		const result = parseStoredTodos(
			JSON.stringify([
				{ completed: true, id: 100, text: "Legacy" },
				{ completed: "yes", id: 200, text: "Invalid" },
				{ completed: false, id: 300, text: "Active" },
			]),
		);

		expect(result).toEqual({
			shouldPersist: true,
			todos: [
				{ completed: true, completedAt: 100, id: 100, text: "Legacy" },
				{ completed: false, completedAt: null, id: 300, text: "Active" },
			],
		});
	});

	test("resets malformed storage instead of trusting it", () => {
		expect(parseStoredTodos("not json")).toEqual({
			shouldPersist: true,
			todos: [],
		});
		expect(parseStoredTodos({ todos: [] })).toEqual({
			shouldPersist: true,
			todos: [],
		});
	});
});
