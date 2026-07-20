type Return<T> = {
	result: T[keyof T] | undefined;
	objKey: keyof T | undefined;
};

const findObjValue = <T extends Record<string, unknown>>(
	obj: T,
	value: string,
): Return<T> => {
	let result: T[keyof T] | undefined;
	let objKey: keyof T | undefined;

	for (const key in obj) {
		if (Object.hasOwn(obj, key)) {
			if (obj[key] === value) {
				result = obj[key]; // Include the property if the predicate returns true
				objKey = key;
			}
		}
	}

	return { result, objKey };
};

export { findObjValue };
