import { describe, expect, test } from "@test/jest";
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
		expect(formatClockTime(date)).toBe("00:00");
	});

	test("ticks only when the visible unit changes", () => {
		expect(getClockTickDelay(date, true)).toBe(750);
		expect(getClockTickDelay(date, false)).toBe(56_750);
		expect(getClockTickDelay(new Date(2026, 0, 1, 0, 0, 0, 0))).toBe(60_000);
		expect(getClockTickDelay(new Date(2026, 0, 1, 0, 0, 0, 999), true)).toBe(1);
	});
});
