/**
 * Parses a settings number without allowing empty, unsafe, or over-limit input.
 *
 * @param value - Raw value from a number input.
 * @param maximum - Largest accepted value, inclusive.
 */
export const parseNonNegativeInteger = (
	value: string,
	maximum = Number.MAX_SAFE_INTEGER,
): number | undefined => {
	if (!/^\d+$/.test(value)) return undefined;

	const parsed = Number.parseInt(value, 10);

	return Number.isSafeInteger(parsed) && parsed <= maximum ? parsed : undefined;
};
