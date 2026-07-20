/** Parses a settings number without allowing an empty input to become `NaN`. */
export const parseNonNegativeInteger = (value: string): number | undefined => {
	if (!/^\d+$/.test(value)) return undefined;

	const parsed = Number.parseInt(value, 10);

	return Number.isSafeInteger(parsed) ? parsed : undefined;
};
