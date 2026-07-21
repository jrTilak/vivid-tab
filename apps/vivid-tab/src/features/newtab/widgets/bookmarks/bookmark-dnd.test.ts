import { describe, expect, test } from "@test/jest";
import { getBookmarkReorder } from "./bookmark-dnd";

const reorder = (overrides: Record<string, unknown> = {}) =>
	getBookmarkReorder({
		fromId: "source",
		fromIndex: 1,
		fromParentId: "parent",
		toId: "target",
		toIndex: 3,
		toParentId: "parent",
		...overrides,
	});

describe("bookmark drag and drop", () => {
	test("adjusts Chrome's destination index for both directions", () => {
		expect(reorder()).toEqual({ bookmarkId: "source", index: 4 });
		expect(reorder({ fromIndex: 4, toIndex: 1 })).toEqual({
			bookmarkId: "source",
			index: 1,
		});
		expect(reorder({ fromId: 42 })).toEqual({ bookmarkId: "42", index: 4 });
	});

	test("rejects no-op, cross-folder, and malformed drag metadata", () => {
		expect(reorder({ toId: "source" })).toBeUndefined();
		expect(reorder({ toId: undefined })).toBeUndefined();
		expect(reorder({ toParentId: "other" })).toBeUndefined();
		expect(reorder({ fromParentId: undefined })).toBeUndefined();
		expect(reorder({ fromIndex: "1" })).toBeUndefined();
		expect(reorder({ toIndex: null })).toBeUndefined();
		expect(reorder({ fromIndex: Number.NaN })).toBeUndefined();
		expect(reorder({ toIndex: 1.5 })).toBeUndefined();
		expect(reorder({ fromIndex: -1 })).toBeUndefined();
	});
});
