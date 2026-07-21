import { describe, expect, test } from "@test/jest";
import {
	getNewtabLayoutType,
	hasLeftLayoutColumn,
	hasRightLayoutColumn,
} from "./newtab-layout";

describe("new-tab layout", () => {
	test("keeps the compact layout when extra bookmark space is disabled", () => {
		expect(getNewtabLayoutType({}, false)).toBe("small");
	});

	test("uses the available center width based on occupied side columns", () => {
		expect(getNewtabLayoutType({ 1: "clock", 5: "weather" }, true)).toBe(
			"small",
		);
		expect(getNewtabLayoutType({ 2: "todos" }, true)).toBe("mid");
		expect(getNewtabLayoutType({}, true)).toBe("large");
	});

	test("detects left and right slots independently", () => {
		const layout = { 3: "quotes", 7: "notes" };

		expect(hasLeftLayoutColumn(layout)).toBe(true);
		expect(hasRightLayoutColumn(layout)).toBe(true);
		expect(hasLeftLayoutColumn({ 1: "" })).toBe(false);
		expect(hasRightLayoutColumn({ 4: "clock", 8: "todos" })).toBe(false);
	});
});
