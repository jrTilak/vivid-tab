import { describe, expect, test } from "@test/jest";
import {
	BACKGROUND_ACTIONS,
	isToggleVividSearchMessage,
} from "./background-actions";

describe("isToggleVividSearchMessage", () => {
	test("accepts the typed internal toggle action", () => {
		expect(
			isToggleVividSearchMessage({
				action: BACKGROUND_ACTIONS.TOGGLE_VIVID_SEARCH,
				targetTabId: 7,
			}),
		).toBe(true);
	});

	test.each([
		undefined,
		null,
		false,
		42,
		"TOGGLE_VIVID_SEARCH",
		{},
		{ action: "UNKNOWN" },
		{ action: BACKGROUND_ACTIONS.TOGGLE_VIVID_SEARCH },
		{
			action: BACKGROUND_ACTIONS.TOGGLE_VIVID_SEARCH,
			targetTabId: "7",
		},
	])("rejects malformed and unrelated messages: %j", (message) => {
		expect(isToggleVividSearchMessage(message)).toBe(false);
	});
});
