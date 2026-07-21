import {
	afterEach,
	beforeEach,
	describe,
	expect,
	jest,
	mock,
	test,
} from "@test/jest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { Todo } from "./todos-model";
import { TODOS_STORAGE_KEY } from "./todos-storage";
import { useTodos } from "./use-todos";

type StorageListener = (
	changes: Record<string, chrome.storage.StorageChange>,
	areaName: string,
) => void;

const listeners = new Set<StorageListener>();
const localGet = mock(async () => ({}));
const localSet = mock(async () => undefined);
const syncGet = mock(async () => ({}));
const syncRemove = mock(async () => undefined);

const emitTodos = (value: unknown, areaName = "local") => {
	for (const listener of listeners) {
		listener({ [TODOS_STORAGE_KEY]: { newValue: value } }, areaName);
	}
};

const setDraft = (
	updateTodoDraft: ReturnType<typeof useTodos>["updateTodoDraft"],
	value: string,
) =>
	updateTodoDraft({ target: { value } } as React.ChangeEvent<HTMLInputElement>);

const submit = (addTodo: ReturnType<typeof useTodos>["addTodo"]) => {
	const preventDefault = mock(() => undefined);
	addTodo({ preventDefault } as unknown as React.FormEvent<HTMLFormElement>);

	return preventDefault;
};

beforeEach(() => {
	jest.useRealTimers();
	listeners.clear();
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
			onChanged: {
				addListener: (listener: StorageListener) => listeners.add(listener),
				removeListener: (listener: StorageListener) =>
					listeners.delete(listener),
			},
			sync: { get: syncGet, remove: syncRemove },
		},
	} as unknown as typeof chrome;
});

afterEach(() => {
	cleanup();
	jest.useRealTimers();
	mock.restore();
});

describe("useTodos editing", () => {
	test("hydrates, adds trimmed text, toggles, sorts, and removes", async () => {
		const stored: Todo[] = [
			{ completed: true, completedAt: 50, id: 50, text: "Done" },
		];
		localGet.mockResolvedValue({
			[TODOS_STORAGE_KEY]: JSON.stringify(stored),
		});
		jest.useFakeTimers();
		jest.setSystemTime(100);
		const { result } = renderHook(() =>
			useTodos({ durationInMinutes: 60, enabled: false }),
		);
		await act(async () => Promise.resolve());
		expect(result.current.todos).toEqual(stored);

		act(() => setDraft(result.current.updateTodoDraft, "  New todo  "));
		const preventDefault = mock(() => undefined);
		act(() =>
			result.current.addTodo({
				preventDefault,
			} as unknown as React.FormEvent<HTMLFormElement>),
		);
		expect(preventDefault).toHaveBeenCalledTimes(1);
		expect(result.current.todoDraft).toBe("");
		expect(result.current.todos.map(({ text }) => text)).toEqual([
			"New todo",
			"Done",
		]);

		act(() => result.current.toggleTodo(100));
		expect(result.current.todos[0]).toMatchObject({
			completed: true,
			completedAt: 100,
			id: 100,
		});

		act(() => result.current.removeTodo(50));
		expect(result.current.todos.map(({ id }) => id)).toEqual([100]);
		await act(async () => Promise.resolve());
		expect(localSet).toHaveBeenCalledTimes(3);
	});

	test("prevents empty submissions without writing", async () => {
		const { result } = renderHook(() =>
			useTodos({ durationInMinutes: 60, enabled: false }),
		);
		await act(async () => Promise.resolve());

		act(() => setDraft(result.current.updateTodoDraft, " \n "));
		const preventDefault = submit(result.current.addTodo);

		expect(preventDefault).toHaveBeenCalledTimes(1);
		expect(result.current.todos).toEqual([]);
		expect(localSet).not.toHaveBeenCalled();
	});

	test("ignores edits for todo IDs that do not exist", async () => {
		const { result } = renderHook(() =>
			useTodos({ durationInMinutes: 60, enabled: false }),
		);
		await act(async () => Promise.resolve());

		act(() => result.current.removeTodo(404));
		act(() => result.current.toggleTodo(404));

		expect(result.current.todos).toEqual([]);
		expect(localSet).not.toHaveBeenCalled();
	});

	test("repairs malformed todos during hydration", async () => {
		localGet.mockResolvedValue({ [TODOS_STORAGE_KEY]: "malformed" });
		const { result } = renderHook(() =>
			useTodos({ durationInMinutes: 60, enabled: false }),
		);

		await waitFor(() =>
			expect(localSet).toHaveBeenCalledWith({ [TODOS_STORAGE_KEY]: "[]" }),
		);
		expect(result.current.todos).toEqual([]);
	});

	test("reconciles external local values and repairs malformed data", async () => {
		const { result } = renderHook(() =>
			useTodos({ durationInMinutes: 60, enabled: false }),
		);
		await act(async () => Promise.resolve());
		const external: Todo[] = [
			{ completed: false, completedAt: null, id: 5, text: "Other tab" },
		];

		act(() => emitTodos(JSON.stringify(external), "sync"));
		expect(result.current.todos).toEqual([]);
		act(() => emitTodos(JSON.stringify(external)));
		expect(result.current.todos).toEqual(external);
		expect(localSet).not.toHaveBeenCalled();
		const unchangedTodos = result.current.todos;
		act(() => emitTodos(JSON.stringify(external)));
		expect(result.current.todos).toBe(unchangedTodos);
		expect(localSet).not.toHaveBeenCalled();

		act(() => emitTodos("malformed"));
		expect(result.current.todos).toEqual([]);
		await act(async () => Promise.resolve());
		expect(localSet).toHaveBeenLastCalledWith({ [TODOS_STORAGE_KEY]: "[]" });
	});

	test("does not let late hydration overwrite a local edit", async () => {
		let resolveStorage: ((value: Record<string, unknown>) => void) | undefined;
		localGet.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					resolveStorage = resolve;
				}),
		);
		jest.useFakeTimers();
		jest.setSystemTime(500);
		const { result } = renderHook(() =>
			useTodos({ durationInMinutes: 60, enabled: false }),
		);

		act(() => setDraft(result.current.updateTodoDraft, "Local"));
		act(() => submit(result.current.addTodo));
		await act(async () => {
			resolveStorage?.({
				[TODOS_STORAGE_KEY]: JSON.stringify([
					{ completed: false, completedAt: null, id: 1, text: "Stale" },
				]),
			});
			await Promise.resolve();
		});

		expect(result.current.todos.map(({ text }) => text)).toEqual(["Local"]);
	});
});

describe("useTodos expiration", () => {
	test("immediately removes todos already expired during hydration", async () => {
		const now = Date.now();
		const expired: Todo = {
			completed: true,
			completedAt: now - 60_000,
			id: 1,
			text: "Already expired",
		};
		localGet.mockResolvedValue({
			[TODOS_STORAGE_KEY]: JSON.stringify([expired]),
		});
		const { result } = renderHook(() =>
			useTodos({ durationInMinutes: 1, enabled: true }),
		);

		await waitFor(() =>
			expect(localSet).toHaveBeenLastCalledWith({ [TODOS_STORAGE_KEY]: "[]" }),
		);
		expect(result.current.todos).toEqual([]);
	});

	test("removes a completed todo at the exact configured deadline", async () => {
		jest.useFakeTimers();
		jest.setSystemTime(30_000);
		const completed: Todo = {
			completed: true,
			completedAt: 0,
			id: 1,
			text: "Expires",
		};
		localGet.mockResolvedValue({
			[TODOS_STORAGE_KEY]: JSON.stringify([completed]),
		});
		const { result } = renderHook(() =>
			useTodos({ durationInMinutes: 1, enabled: true }),
		);
		await act(async () => Promise.resolve());
		expect(result.current.todos).toEqual([completed]);

		act(() => jest.advanceTimersByTime(29_999));
		expect(result.current.todos).toEqual([completed]);
		act(() => jest.advanceTimersByTime(1));
		expect(result.current.todos).toEqual([]);
		expect(localSet).toHaveBeenLastCalledWith({ [TODOS_STORAGE_KEY]: "[]" });
	});

	test("keeps expired todos when automatic removal is disabled", async () => {
		jest.useFakeTimers();
		jest.setSystemTime(120_000);
		const completed: Todo = {
			completed: true,
			completedAt: 0,
			id: 1,
			text: "Keep",
		};
		localGet.mockResolvedValue({
			[TODOS_STORAGE_KEY]: JSON.stringify([completed]),
		});
		const { result } = renderHook(() =>
			useTodos({ durationInMinutes: 1, enabled: false }),
		);
		await act(async () => Promise.resolve());

		expect(result.current.todos).toEqual([completed]);
		expect(localSet).not.toHaveBeenCalled();
		act(() => jest.advanceTimersByTime(10 * 60_000));
		expect(result.current.todos).toEqual([completed]);
		expect(localSet).not.toHaveBeenCalled();
	});

	test("reschedules expiration beyond the browser timeout ceiling", async () => {
		const now = Date.now();
		const completed: Todo = {
			completed: true,
			completedAt: now,
			id: 1,
			text: "Long lived",
		};
		localGet.mockResolvedValue({
			[TODOS_STORAGE_KEY]: JSON.stringify([completed]),
		});
		const { result, rerender, unmount } = renderHook(
			({ enabled }) => useTodos({ durationInMinutes: 525_600, enabled }),
			{ initialProps: { enabled: false } },
		);
		await act(async () => Promise.resolve());

		const scheduledCallbacks: Array<() => void> = [];
		const timeoutSpy = jest
			.spyOn(globalThis, "setTimeout")
			.mockImplementation(((callback: TimerHandler, delay?: number) => {
				if (delay === 2_147_483_647 && typeof callback === "function") {
					scheduledCallbacks.push(() => callback());
				}

				return 1 as unknown as ReturnType<typeof setTimeout>;
			}) as typeof setTimeout);
		rerender({ enabled: true });
		expect(scheduledCallbacks).toHaveLength(1);

		act(() => scheduledCallbacks[0]?.());
		expect(result.current.todos).toEqual([completed]);
		expect(localSet).not.toHaveBeenCalled();
		expect(scheduledCallbacks).toHaveLength(2);

		unmount();
		timeoutSpy.mockRestore();
	});

	test("does not reschedule a stale expiry callback with no completed todos", async () => {
		const now = Date.now();
		const completed: Todo = {
			completed: true,
			completedAt: now,
			id: 1,
			text: "Initially completed",
		};
		const active: Todo = {
			completed: false,
			completedAt: null,
			id: 2,
			text: "Still active",
		};
		localGet.mockResolvedValue({
			[TODOS_STORAGE_KEY]: JSON.stringify([completed]),
		});
		const scheduledCallbacks: Array<() => void> = [];
		const timeoutSpy = jest
			.spyOn(globalThis, "setTimeout")
			.mockImplementation(((callback: TimerHandler, _delay?: number) => {
				if (typeof callback === "function") {
					scheduledCallbacks.push(() => callback());
				}

				return 1 as unknown as ReturnType<typeof setTimeout>;
			}) as typeof setTimeout);
		const { result, unmount } = renderHook(() =>
			useTodos({ durationInMinutes: 60, enabled: true }),
		);
		await act(async () => Promise.resolve());
		expect(scheduledCallbacks).toHaveLength(1);

		act(() => emitTodos(JSON.stringify([active])));
		expect(result.current.todos).toEqual([active]);

		act(() => scheduledCallbacks[0]?.());
		expect(scheduledCallbacks).toHaveLength(1);
		expect(result.current.todos).toEqual([active]);
		expect(localSet).not.toHaveBeenCalled();

		unmount();
		timeoutSpy.mockRestore();
	});
});

describe("useTodos lifecycle errors", () => {
	test("reports loading and saving failures and removes its listener", async () => {
		localGet.mockRejectedValueOnce(new Error("read failed"));
		const errorLog = jest
			.spyOn(console, "error")
			.mockImplementation(() => undefined);
		const { result, unmount } = renderHook(() =>
			useTodos({ durationInMinutes: 60, enabled: false }),
		);
		await waitFor(() => expect(errorLog).toHaveBeenCalledTimes(1));
		expect(listeners.size).toBe(1);

		localSet.mockRejectedValueOnce(new Error("write failed"));
		act(() => setDraft(result.current.updateTodoDraft, "Todo"));
		act(() => submit(result.current.addTodo));
		await waitFor(() => expect(errorLog).toHaveBeenCalledTimes(2));

		unmount();
		expect(listeners.size).toBe(0);
		errorLog.mockRestore();
	});
});
