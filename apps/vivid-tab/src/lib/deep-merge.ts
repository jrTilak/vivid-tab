type PlainObject = Record<string, unknown>;

const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/**
 * Controls path-specific replacement behavior while merging persisted data.
 */
export interface DeepMergeOptions {
	/**
	 * Decides whether the persisted value at a path replaces its default as one
	 * atomic value instead of recursively merging object properties.
	 */
	shouldReplace?: (path: readonly string[]) => boolean;
}

const isPlainObject = (value: unknown): value is PlainObject => {
	if (value === null || typeof value !== "object") return false;

	const prototype = Object.getPrototypeOf(value);

	return prototype === Object.prototype || prototype === null;
};

const cloneValue = (value: unknown): unknown => {
	if (Array.isArray(value)) {
		return value.map(cloneValue);
	}

	if (!isPlainObject(value)) return value;

	const clone: PlainObject = {};

	for (const [key, child] of Object.entries(value)) {
		/*
		 * Settings can originate from imported JSON. Ignoring these special keys
		 * prevents an imported object from modifying an object's prototype.
		 */
		if (UNSAFE_KEYS.has(key)) continue;
		clone[key] = cloneValue(child);
	}

	return clone;
};

/**
 * Applies a persisted value over current defaults without mutating either input.
 *
 * Plain objects merge recursively. Arrays, primitives, and `null` replace their
 * defaults as complete values. An invalid type is deliberately preserved so the
 * caller's runtime schema can reject it instead of silently hiding corruption.
 * Missing (`undefined`) values receive a fresh clone of the corresponding default.
 * Prototype-mutating keys are omitted at every cloned or merged object level.
 *
 * @param defaults - Current complete value used to fill fields absent from storage.
 * @param persisted - Partial or untrusted value read from persistent storage.
 * @param options - Optional rules for values that must be replaced atomically.
 * @returns A detached merged value without mutating either input.
 *
 * @example
 * ```ts
 * deepMerge(
 *   { widgets: { layout: { 0: "searchbar", 1: "clock" } } },
 *   { widgets: { layout: { 0: "searchbar" } } },
 *   { shouldReplace: (path) => path.join(".") === "widgets.layout" },
 * );
 * // { widgets: { layout: { 0: "searchbar" } } }
 * ```
 */
export const deepMerge = (
	defaults: unknown,
	persisted: unknown,
	options: DeepMergeOptions = {},
): unknown => {
	const mergeAtPath = (
		defaultValue: unknown,
		persistedValue: unknown,
		path: readonly string[],
	): unknown => {
		if (persistedValue === undefined) return cloneValue(defaultValue);
		if (options.shouldReplace?.(path)) return cloneValue(persistedValue);

		if (!isPlainObject(defaultValue) || !isPlainObject(persistedValue)) {
			return cloneValue(persistedValue);
		}

		const merged = cloneValue(defaultValue) as PlainObject;

		for (const [key, child] of Object.entries(persistedValue)) {
			if (UNSAFE_KEYS.has(key)) continue;

			merged[key] = mergeAtPath(defaultValue[key], child, [...path, key]);
		}

		return merged;
	};

	return mergeAtPath(defaults, persisted, []);
};
