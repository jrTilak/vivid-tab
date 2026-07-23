import { randomInt } from "@/lib/random-int";

/**
 * Creates a shuffled copy using the unbiased Fisher-Yates algorithm.
 * The source collection is never mutated.
 *
 * @param values - Collection to copy and shuffle.
 * @param random - Source returning a number in the `0 <= value < 1` range.
 * @returns A new array containing the same values in randomized order.
 *
 * @example
 * shuffle(["first", "second"], () => 0);
 * // Returns ["second", "first"].
 */
export const shuffle = <T>(
	values: readonly T[],
	random: () => number = Math.random,
): T[] => {
	const shuffled = [...values];

	for (let index = shuffled.length - 1; index > 0; index--) {
		const swapIndex = randomInt(0, index, random);
		const current = shuffled[index];
		shuffled[index] = shuffled[swapIndex] as T;
		shuffled[swapIndex] = current as T;
	}

	return shuffled;
};
