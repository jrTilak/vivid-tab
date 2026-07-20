import { describe, expect, test } from "bun:test";
import {
	parseStoredBookmarkIcon,
	readIconFile,
} from "./bookmark-editor-service";

describe("bookmark editor service", () => {
	test("accepts only non-empty string icons from storage", () => {
		expect(parseStoredBookmarkIcon({ icon: "data:image/png;base64,abc" })).toBe(
			"data:image/png;base64,abc",
		);
		expect(parseStoredBookmarkIcon({ icon: "" })).toBeNull();
		expect(parseStoredBookmarkIcon({ icon: 12 })).toBeNull();
		expect(parseStoredBookmarkIcon(null)).toBeNull();
	});

	test("rejects a non-image before invoking FileReader", async () => {
		const file = new File(["plain text"], "notes.txt", {
			type: "text/plain",
		});

		expect(readIconFile(file)).rejects.toThrow("not an image");
	});
});
