import { beforeEach, describe, expect, mock, test } from "@test/jest";
import { openBookmarkUrl } from "./open-bookmark-url";

const create = mock(async () => undefined);
const update = mock(async () => undefined);

beforeEach(() => {
	create.mockClear();
	update.mockClear();
	globalThis.chrome = {
		tabs: { create, update },
	} as unknown as typeof chrome;
});

describe("open bookmark URL", () => {
	test("opens in a new active tab when requested", () => {
		openBookmarkUrl("https://example.com", true);

		expect(create).toHaveBeenCalledWith({
			active: true,
			url: "https://example.com",
		});
		expect(update).not.toHaveBeenCalled();
	});

	test("reuses the active tab otherwise", () => {
		openBookmarkUrl("https://example.com", false);

		expect(update).toHaveBeenCalledWith({
			active: true,
			url: "https://example.com",
		});
		expect(create).not.toHaveBeenCalled();
	});
});
