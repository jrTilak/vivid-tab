import { describe, expect, test } from "@test/jest";
import { shuffle } from "./shuffle";

describe("shuffle", () => {
	test("uses Fisher-Yates without mutating the source collection", () => {
		const values = ["first", "second", "third"];

		const result = shuffle(values, () => 0);

		expect(result).toEqual(["second", "third", "first"]);
		expect(result).not.toBe(values);
		expect(values).toEqual(["first", "second", "third"]);
	});

	test("returns fresh arrays for empty and single-value collections", () => {
		const empty: string[] = [];
		const single = ["only"];

		const shuffledEmpty = shuffle(empty);
		const shuffledSingle = shuffle(single);

		expect(shuffledEmpty).toEqual([]);
		expect(shuffledEmpty).not.toBe(empty);
		expect(shuffledSingle).toEqual(["only"]);
		expect(shuffledSingle).not.toBe(single);
	});
});
