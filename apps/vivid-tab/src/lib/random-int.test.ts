import { describe, expect, test } from "@test/jest";
import { randomInt } from "./random-int";

describe("randomInt", () => {
	test("maps random values to both inclusive boundaries", () => {
		expect(randomInt(-2, 2, () => 0)).toBe(-2);
		expect(randomInt(-2, 2, () => 0.999_999)).toBe(2);
		expect(randomInt(4, 4, () => 0.5)).toBe(4);
	});
});
