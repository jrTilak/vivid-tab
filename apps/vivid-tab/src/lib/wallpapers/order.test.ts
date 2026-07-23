import { describe, expect, test } from "@test/jest";
import { orderWallpaperIds } from "./order";

describe("wallpaper ordering", () => {
	test("places manual uploads before bookmarked and remaining wallpapers", () => {
		expect(
			orderWallpaperIds(
				["online-1", "local_2", "saved", "local-1", "online-2"],
				["saved"],
			),
		).toEqual(["local_2", "local-1", "saved", "online-1", "online-2"]);
	});

	test("preserves relative order within every group", () => {
		expect(
			orderWallpaperIds(
				["online-2", "saved-2", "local_2", "saved-1", "local_1"],
				["saved-1", "saved-2"],
			),
		).toEqual(["local_2", "local_1", "saved-2", "saved-1", "online-2"]);
	});

	test("deduplicates IDs and ignores stale bookmark entries", () => {
		expect(
			orderWallpaperIds(
				["online", "online", "local_manual", "local_manual"],
				["missing", "online", "online"],
			),
		).toEqual(["local_manual", "online"]);
	});

	test("returns an empty list for an empty gallery", () => {
		expect(orderWallpaperIds([], ["missing"])).toEqual([]);
	});
});
