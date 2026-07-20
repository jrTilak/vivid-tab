type PlainObject = Record<string, unknown>;

const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

export interface DeepMergeOptions {
	/**
	 * Return true when a value should replace its default atomically instead of
	 * recursively merging its object properties.
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
