import { beforeEach, describe, expect, mock, test } from "@test/jest";
import { BACKGROUND_ACTIONS } from "@/constants/background-actions";
import { submitSearch } from "./search-service";

const sendMessage = mock(() => Promise.resolve());

beforeEach(() => {
	sendMessage.mockClear();
	globalThis.chrome = {
		runtime: { sendMessage },
	} as unknown as typeof chrome;
});

describe("search service", () => {
	test("trims and sends a search with the configured destination", () => {
		expect(submitSearch("  vivid tab  ", "new-tab")).toBe(true);
		expect(sendMessage).toHaveBeenCalledWith({
			action: BACKGROUND_ACTIONS.SEARCH_QUERY,
			openIn: "new-tab",
			query: "vivid tab",
		});
	});

	test("does not send an empty query", () => {
		expect(submitSearch(" \n\t ", "current-tab")).toBe(false);
		expect(sendMessage).not.toHaveBeenCalled();
	});
});
