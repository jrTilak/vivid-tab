const MINUTE_IN_MILLISECONDS = 60_000;

interface TodoBase {
	id: number;
	text: string;
}

export type Todo = TodoBase &
	(
		| {
				completed: false;
				completedAt: null;
		  }
		| {
				completed: true;
				completedAt: number;
		  }
	);

export const createTodo = (text: string, createdAt: number): Todo => ({
	completed: false,
	completedAt: null,
	id: createdAt,
	text,
});

export const deleteTodo = (
	todos: readonly Todo[],
	id: number,
): Todo[] | readonly Todo[] => {
	const nextTodos = todos.filter((todo) => todo.id !== id);

	return nextTodos.length === todos.length ? todos : nextTodos;
};

export const toggleTodo = (
	todos: readonly Todo[],
	id: number,
	completedAt: number,
): Todo[] | readonly Todo[] => {
	let wasUpdated = false;
	const nextTodos = todos.map((todo): Todo => {
		if (todo.id !== id) return todo;

		wasUpdated = true;

		return todo.completed
			? { ...todo, completed: false, completedAt: null }
			: { ...todo, completed: true, completedAt };
	});

	return wasUpdated ? nextTodos : todos;
};

const getExpirationDuration = (durationInMinutes: number) =>
	Math.max(0, durationInMinutes) * MINUTE_IN_MILLISECONDS;

const getExpirationTime = (todo: Todo, durationInMinutes: number) =>
	todo.completed
		? todo.completedAt + getExpirationDuration(durationInMinutes)
		: null;

export const removeExpiredTodos = (
	todos: readonly Todo[],
	durationInMinutes: number,
	now: number,
): Todo[] | readonly Todo[] => {
	const nextTodos = todos.filter((todo) => {
		const expirationTime = getExpirationTime(todo, durationInMinutes);

		return expirationTime === null || expirationTime > now;
	});

	return nextTodos.length === todos.length ? todos : nextTodos;
};

export const getNearestExpirationDelay = (
	todos: readonly Todo[],
	durationInMinutes: number,
	now: number,
): number | null => {
	let nearestExpiration = Number.POSITIVE_INFINITY;

	for (const todo of todos) {
		const expirationTime = getExpirationTime(todo, durationInMinutes);

		if (expirationTime !== null && expirationTime < nearestExpiration) {
			nearestExpiration = expirationTime;
		}
	}

	return Number.isFinite(nearestExpiration)
		? Math.max(0, nearestExpiration - now)
		: null;
};

export const sortTodos = (todos: readonly Todo[]): Todo[] =>
	todos.slice().sort((first, second) => {
		if (first.completed !== second.completed) {
			return first.completed ? 1 : -1;
		}

		return second.id - first.id;
	});
