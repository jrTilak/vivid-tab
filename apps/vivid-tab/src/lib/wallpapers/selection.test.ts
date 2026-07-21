import { describe, expect, test } from "@test";
import {
	getWallpaperRotationInterval,
	isWallpaperRotationDue,
	selectRandomWallpaperId,
} from "./selection";

describe("wallpaper selection", () => {
	test("always selects a different image when an alternative exists", () => {
		expect(selectRandomWallpaperId(["a", "b"], "a", () => 0)).toBe("b");
		expect(selectRandomWallpaperId(["a", "b", "c"], "b", () => 0.99)).toBe("c");
		expect(selectRandomWallpaperId(["a", "b", "c"], "c", () => 0)).toBe("a");
	});

	test("handles empty and single-image galleries", () => {
		expect(selectRandomWallpaperId([], null)).toBeNull();
		expect(selectRandomWallpaperId(["only"], "only")).toBe("only");
	});

	test("uses the full gallery when the current image is unknown", () => {
		expect(selectRandomWallpaperId(["a", "b", "c"], "removed", () => 0.5)).toBe(
			"b",
		);
		expect(selectRandomWallpaperId(["a", "b"], null, () => 0)).toBe("a");
		expect(selectRandomWallpaperId(["a", "b"], null, () => Number.NaN)).toBe(
			"a",
		);
	});

	test("maps periodic modes to their interval", () => {
		expect(getWallpaperRotationInterval("off")).toBeNull();
		expect(getWallpaperRotationInterval("on-each-tab")).toBeNull();
		expect(getWallpaperRotationInterval("hourly")).toBe(3_600_000);
		expect(getWallpaperRotationInterval("daily")).toBe(86_400_000);
	});

	test("supports current numeric and legacy date timestamps", () => {
		const now = Date.UTC(2026, 6, 20, 12);

		expect(
			isWallpaperRotationDue(String(now - 3_600_000), 3_600_000, now),
		).toBe(true);
		expect(isWallpaperRotationDue(String(now - 1_000), 3_600_000, now)).toBe(
			false,
		);
		expect(
			isWallpaperRotationDue(
				new Date(now - 86_400_000).toString(),
				86_400_000,
				now,
			),
		).toBe(true);
		expect(isWallpaperRotationDue("not-a-date", 3_600_000, now)).toBe(true);
		expect(isWallpaperRotationDue("  ", 3_600_000, now)).toBe(true);
		expect(isWallpaperRotationDue(null, 3_600_000, now)).toBe(true);
		expect(isWallpaperRotationDue(now - 3_600_000, 3_600_000, now)).toBe(true);
		expect(
			isWallpaperRotationDue(Number.POSITIVE_INFINITY, 3_600_000, now),
		).toBe(true);
		expect(isWallpaperRotationDue(now + 1_000, 3_600_000, now)).toBe(false);
		expect(isWallpaperRotationDue(Date.now() + 1_000, 3_600_000)).toBe(false);
	});
});
