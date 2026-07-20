import { describe, expect, test } from "bun:test";
import {
	parseReviewPromptState,
	shouldShowReviewPrompt,
} from "./review-prompt";

describe("review prompt", () => {
	test("shows the first prompt after seven days", () => {
		const now = new Date("2026-07-20T00:00:00Z");
		const state = parseReviewPromptState({
			"vivid-tab.installed-date": "2026-07-13T00:00:00Z",
		});

		expect(shouldShowReviewPrompt(state, now)).toBe(true);
	});

	test("rejects malformed storage and stops after four prompts", () => {
		const malformed = parseReviewPromptState({
			"vivid-tab.installed-date": {},
			"vivid-tab.review-times-asked": "4",
		});
		expect(shouldShowReviewPrompt(malformed, new Date())).toBe(false);

		const exhausted = parseReviewPromptState({
			"vivid-tab.installed-date": "2025-01-01T00:00:00Z",
			"vivid-tab.review-times-asked": 4,
		});
		expect(shouldShowReviewPrompt(exhausted, new Date("2026-07-20"))).toBe(
			false,
		);
	});
});
