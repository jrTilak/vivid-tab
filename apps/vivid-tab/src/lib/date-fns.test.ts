import { describe, expect, test } from "@test/jest";
import {
	format12h,
	format12hWithSeconds,
	format24h,
	format24hWithSeconds,
	formatDayDate,
} from "./date-fns";

describe("date formatting", () => {
	test("formats weekday, padded day, and month names", () => {
		expect(formatDayDate(new Date(2026, 0, 4, 8, 9, 7))).toBe(
			"Sunday 04, January",
		);
		expect(formatDayDate(new Date(2026, 11, 26, 8, 9, 7))).toBe(
			"Saturday 26, December",
		);
	});

	test("handles midnight, noon, and ordinary 12-hour values", () => {
		const midnight = new Date(2026, 0, 1, 0, 5, 3);
		const morning = new Date(2026, 0, 1, 9, 5, 3);
		const noon = new Date(2026, 0, 1, 12, 5, 3);
		const evening = new Date(2026, 0, 1, 21, 5, 3);

		expect(format12h(midnight)).toBe("12:05 AM");
		expect(format12hWithSeconds(midnight)).toBe("12:05:03 AM");
		expect(format12h(morning)).toBe("09:05 AM");
		expect(format12hWithSeconds(noon)).toBe("12:05:03 PM");
		expect(format12h(evening)).toBe("09:05 PM");
	});

	test("pads every component in 24-hour output", () => {
		const morning = new Date(2026, 0, 1, 6, 5, 3);
		const evening = new Date(2026, 0, 1, 23, 59, 58);

		expect(format24h(morning)).toBe("06:05");
		expect(format24hWithSeconds(morning)).toBe("06:05:03");
		expect(format24h(evening)).toBe("23:59");
		expect(format24hWithSeconds(evening)).toBe("23:59:58");
	});
});
