import { describe, expect, test } from "@test";
import { filterObj, findObjValue } from "./object";

describe("filterObj", () => {
	test("filters own properties and passes their keys to the predicate", () => {
		const prototype = { inherited: "ignore" };
		const input = Object.assign(
			Object.create(prototype) as Record<string, number>,
			{
				first: 1,
				second: 2,
			},
		);
		const visits: Array<[number, string]> = [];

		expect(
			filterObj(input, (value, key) => {
				visits.push([value, key]);
				return key === "second" && value > 1;
			}),
		).toEqual({ second: 2 });
		expect(visits).toEqual([
			[1, "first"],
			[2, "second"],
		]);
	});

	test("returns a fresh empty object when no property matches", () => {
		const input = { first: 1 };
		const result = filterObj(input, () => false);

		expect(result).toEqual({});
		expect(result).not.toBe(input);
	});
});

describe("findObjValue", () => {
	test("finds a matching own value and ignores inherited matches", () => {
		const prototype = { inherited: "target" };
		const input = Object.assign(
			Object.create(prototype) as Record<string, string>,
			{ first: "other", second: "target" },
		);

		expect(findObjValue(input, "target")).toEqual({
			objKey: "second",
			result: "target",
		});
	});

	test("reports a missing value", () => {
		expect(findObjValue({ first: "other" }, "missing")).toEqual({
			objKey: undefined,
			result: undefined,
		});
	});

	test("returns the last own match when values are duplicated", () => {
		expect(
			findObjValue(
				{ first: "target", middle: "other", last: "target" },
				"target",
			),
		).toEqual({ objKey: "last", result: "target" });
	});
});
