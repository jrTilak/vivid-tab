type FindObjectValueResult<T extends Record<string, unknown>> = {
	objKey: keyof T | undefined;
	result: T[keyof T] | undefined;
};

/**
 * Creates a shallow object containing the input's own enumerable properties
 * that satisfy the supplied predicate. Inherited properties are ignored.
 *
 * @param object - Object whose properties should be filtered.
 * @param predicate - Called with each own value and its corresponding key.
 * @returns A new object containing only the accepted properties.
 */
export const filterObj = <T extends Record<string, unknown>>(
	object: T,
	predicate: (value: T[keyof T], key: keyof T) => boolean,
): Partial<T> => {
	const result: Partial<T> = {};

	for (const key in object) {
		if (Object.hasOwn(object, key) && predicate(object[key], key)) {
			result[key] = object[key];
		}
	}

	return result;
};

/**
 * Finds an own enumerable property whose value strictly equals the requested
 * value. When duplicate values exist, the last enumerated match is returned.
 *
 * @param object - Object to inspect without traversing its prototype chain.
 * @param value - String value to match using strict equality.
 * @returns The matched value and key, or `undefined` for both when absent.
 */
export const findObjValue = <T extends Record<string, unknown>>(
	object: T,
	value: string,
): FindObjectValueResult<T> => {
	let result: T[keyof T] | undefined;
	let objKey: keyof T | undefined;

	for (const key in object) {
		if (Object.hasOwn(object, key) && object[key] === value) {
			result = object[key];
			objKey = key;
		}
	}

	return { objKey, result };
};
