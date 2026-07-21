import { describe, expect, test } from "@test/jest";
import { parseNonNegativeInteger } from "./settings-values";

describe("parseNonNegativeInteger", () => {
	test.each([
		["0", 0],
		["0007", 7],
		["42", 42],
		[String(Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER],
	])("parses %j", (source, expected) => {
		expect(parseNonNegativeInteger(source)).toBe(expected);
	});

	test.each([
		"",
		" ",
		"-1",
		"+1",
		"1.5",
		"1e3",
		"12px",
		"１２",
		String(Number.MAX_SAFE_INTEGER + 1),
	])("rejects invalid integer input %j", (source) => {
		expect(parseNonNegativeInteger(source)).toBeUndefined();
	});
});
