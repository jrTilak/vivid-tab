import { describe, expect, test } from "bun:test";
import { formatClockTime, getClockTickDelay } from "./clock-model";

describe("clock model", () => {
	const date = new Date(2026, 0, 1, 21, 5, 3, 250);

	test("formats each supported clock mode", () => {
		expect(formatClockTime(date, { timeFormat: "12h" })).toBe("09:05 PM");
		expect(
			formatClockTime(date, { timeFormat: "12h", showSeconds: true }),
		).toBe("09:05:03 PM");
		expect(formatClockTime(date, { timeFormat: "24h" })).toBe("21:05");
		expect(
			formatClockTime(date, { timeFormat: "24h", showSeconds: true }),
		).toBe("21:05:03");
	});

	test("ticks only when the visible unit changes", () => {
		expect(getClockTickDelay(date, true)).toBe(750);
		expect(getClockTickDelay(date, false)).toBe(56_750);
	});
});
