/**
 * Returns a uniformly distributed integer inside an inclusive range.
 *
 * The caller is responsible for providing integer bounds where `min <= max`.
 * A custom random source can be supplied for deterministic consumers and tests.
 *
 * @param min - Inclusive lower bound.
 * @param max - Inclusive upper bound.
 * @param random - Source returning a number in the `0 <= value < 1` range.
 * @returns An integer between `min` and `max`, including both boundaries.
 *
 * @example
 * randomInt(1, 4, () => 0);
 * // Returns 1.
 */
export const randomInt = (
	min: number,
	max: number,
	random: () => number = Math.random,
): number => Math.floor(random() * (max - min + 1)) + min;
