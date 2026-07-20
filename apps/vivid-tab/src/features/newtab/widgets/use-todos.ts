import {
	type ChangeEvent,
	type FormEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	createTodo,
	deleteTodo,
	getNearestExpirationDelay,
	removeExpiredTodos,
	sortTodos,
	type Todo,
	toggleTodo,
} from "./todos-model";
import {
	loadTodos,
	parseStoredTodos,
	saveTodos,
	TODOS_STORAGE_KEY,
} from "./todos-storage";

const MAX_TIMEOUT_DELAY = 2_147_483_647;

interface TodoExpirationSettings {
	durationInMinutes: number;
	enabled: boolean;
}

type UpdateTodos = (current: readonly Todo[]) => Todo[] | readonly Todo[];

const persistTodos = (todos: readonly Todo[]) => {
	void saveTodos(todos).catch((error: unknown) => {
		console.error("Failed to save todos:", error);
	});
};

export const useTodos = ({
	durationInMinutes,
	enabled,
}: TodoExpirationSettings) => {
	const [todos, setTodos] = useState<readonly Todo[]>([]);
	const [todoDraft, setTodoDraft] = useState("");
	const todosRef = useRef<readonly Todo[]>([]);
	const localRevisionRef = useRef(0);

	const commitTodos = useCallback((update: UpdateTodos) => {
		const nextTodos = update(todosRef.current);

		if (nextTodos === todosRef.current) return;

		todosRef.current = nextTodos;
		localRevisionRef.current += 1;
		setTodos(nextTodos);
		persistTodos(nextTodos);
	}, []);

	useEffect(() => {
		let disposed = false;
		const hydrationRevision = localRevisionRef.current;

		void loadTodos()
			.then((result) => {
				if (disposed || localRevisionRef.current !== hydrationRevision) {
					return;
				}

				todosRef.current = result.todos;
				setTodos(result.todos);

				if (result.shouldPersist) persistTodos(result.todos);
			})
			.catch((error: unknown) => {
				console.error("Failed to load todos:", error);
			});

		return () => {
			disposed = true;
		};
	}, []);

	useEffect(() => {
		const handleStorageChange = (
			changes: Record<string, chrome.storage.StorageChange>,
			areaName: string,
		) => {
			if (areaName !== "local" || !changes[TODOS_STORAGE_KEY]) return;

			const parsed = parseStoredTodos(changes[TODOS_STORAGE_KEY].newValue);
			const currentTodos = todosRef.current;
			const isUnchanged =
				currentTodos.length === parsed.todos.length &&
				currentTodos.every((todo, index) => {
					const nextTodo = parsed.todos[index];

					return (
						nextTodo?.id === todo.id &&
						nextTodo.text === todo.text &&
						nextTodo.completed === todo.completed &&
						nextTodo.completedAt === todo.completedAt
					);
				});

			if (isUnchanged) return;

			localRevisionRef.current += 1;
			todosRef.current = parsed.todos;
			setTodos(parsed.todos);
			if (parsed.shouldPersist) persistTodos(parsed.todos);
		};

		chrome.storage.onChanged.addListener(handleStorageChange);

		return () => chrome.storage.onChanged.removeListener(handleStorageChange);
	}, []);

	useEffect(() => {
		if (!enabled) return;

		const now = Date.now();
		const currentTodos = todos;
		const activeTodos = removeExpiredTodos(
			currentTodos,
			durationInMinutes,
			now,
		);

		if (activeTodos !== currentTodos) {
			commitTodos(() => activeTodos);
			return;
		}

		const delay = getNearestExpirationDelay(
			currentTodos,
			durationInMinutes,
			now,
		);

		if (delay === null) return;

		let timeout: ReturnType<typeof setTimeout>;
		const expireOrReschedule = () => {
			const latestTodos = todosRef.current;
			const nextTodos = removeExpiredTodos(
				latestTodos,
				durationInMinutes,
				Date.now(),
			);

			if (nextTodos !== latestTodos) {
				commitTodos(() => nextTodos);
				return;
			}

			/* Browser timeouts are capped, so long durations need another pass. */
			const nextDelay = getNearestExpirationDelay(
				latestTodos,
				durationInMinutes,
				Date.now(),
			);

			if (nextDelay !== null) {
				timeout = setTimeout(
					expireOrReschedule,
					Math.min(nextDelay, MAX_TIMEOUT_DELAY),
				);
			}
		};

		timeout = setTimeout(
			expireOrReschedule,
			Math.min(delay, MAX_TIMEOUT_DELAY),
		);

		return () => clearTimeout(timeout);
	}, [commitTodos, durationInMinutes, enabled, todos]);

	const addTodo = useCallback(
		(event: FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			const text = todoDraft.trim();

			if (!text) return;

			commitTodos((current) => [...current, createTodo(text, Date.now())]);
			setTodoDraft("");
		},
		[commitTodos, todoDraft],
	);

	const removeTodo = useCallback(
		(id: number) => {
			commitTodos((current) => deleteTodo(current, id));
		},
		[commitTodos],
	);

	const toggleTodoById = useCallback(
		(id: number) => {
			commitTodos((current) => toggleTodo(current, id, Date.now()));
		},
		[commitTodos],
	);

	const updateTodoDraft = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			setTodoDraft(event.target.value);
		},
		[],
	);

	return {
		addTodo,
		removeTodo,
		todoDraft,
		todos: useMemo(() => sortTodos(todos), [todos]),
		toggleTodo: toggleTodoById,
		updateTodoDraft,
	};
};
