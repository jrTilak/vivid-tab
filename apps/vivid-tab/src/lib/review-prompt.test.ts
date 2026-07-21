import { afterEach, describe, expect, mock, test } from "@test";
import { LOCAL_STORAGE } from "@/constants/keys";
import {
	checkAndRecordReviewPrompt,
	parseReviewPromptState,
	shouldShowReviewPrompt,
} from "./review-prompt";

const originalChrome = globalThis.chrome;

afterEach(() => {
	globalThis.chrome = originalChrome;
});

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

	test("normalizes corrupt and fractional prompt counts", () => {
		expect(
			parseReviewPromptState({
				[LOCAL_STORAGE.reviewTimesAsked]: Number.NaN,
			}).timesAsked,
		).toBe(0);
		expect(
			parseReviewPromptState({
				[LOCAL_STORAGE.reviewTimesAsked]: Number.POSITIVE_INFINITY,
			}).timesAsked,
		).toBe(0);
		expect(
			parseReviewPromptState({
				[LOCAL_STORAGE.reviewTimesAsked]: -4,
			}).timesAsked,
		).toBe(0);
		expect(
			parseReviewPromptState({
				[LOCAL_STORAGE.reviewTimesAsked]: 2.9,
			}).timesAsked,
		).toBe(2);
	});

	test("accepts numeric dates and rejects invalid date strings", () => {
		const installedAt = Date.UTC(2026, 0, 1);
		const state = parseReviewPromptState({
			[LOCAL_STORAGE.installedDate]: installedAt,
			[LOCAL_STORAGE.reviewLastAskedAt]: "not-a-date",
		});

		expect(state.installedAt?.getTime()).toBe(installedAt);
		expect(state.lastAskedAt).toBeUndefined();
	});

	test("uses exact first and repeat prompt boundaries", () => {
		const now = new Date("2026-07-20T00:00:00Z");
		const justBeforeSevenDays = parseReviewPromptState({
			[LOCAL_STORAGE.installedDate]: "2026-07-13T00:00:00.001Z",
		});
		const exactlySevenDays = parseReviewPromptState({
			[LOCAL_STORAGE.installedDate]: "2026-07-13T00:00:00Z",
		});
		const beforeRepeat = parseReviewPromptState({
			[LOCAL_STORAGE.installedDate]: "2025-01-01T00:00:00Z",
			[LOCAL_STORAGE.reviewLastAskedAt]: "2026-04-21T00:00:00.001Z",
			[LOCAL_STORAGE.reviewTimesAsked]: 1,
		});
		const atRepeat = parseReviewPromptState({
			[LOCAL_STORAGE.installedDate]: "2025-01-01T00:00:00Z",
			[LOCAL_STORAGE.reviewLastAskedAt]: "2026-04-21T00:00:00Z",
			[LOCAL_STORAGE.reviewTimesAsked]: 1,
		});

		expect(shouldShowReviewPrompt(justBeforeSevenDays, now)).toBe(false);
		expect(shouldShowReviewPrompt(exactlySevenDays, now)).toBe(true);
		expect(shouldShowReviewPrompt(beforeRepeat, now)).toBe(false);
		expect(shouldShowReviewPrompt(atRepeat, now)).toBe(true);
	});

	test("requires a valid installation and repeat timestamp", () => {
		const now = new Date("2026-07-20T00:00:00Z");

		expect(
			shouldShowReviewPrompt(
				parseReviewPromptState({
					[LOCAL_STORAGE.reviewTimesAsked]: 1,
				}),
				now,
			),
		).toBe(false);
		expect(
			shouldShowReviewPrompt(
				parseReviewPromptState({
					[LOCAL_STORAGE.installedDate]: "2025-01-01T00:00:00Z",
					[LOCAL_STORAGE.reviewTimesAsked]: 1,
				}),
				now,
			),
		).toBe(false);
	});

	test("coalesces simultaneous checks and records one prompt", async () => {
		let resolveRead: ((value: Record<string, unknown>) => void) | undefined;
		const get = mock(
			() =>
				new Promise<Record<string, unknown>>((resolve) => {
					resolveRead = resolve;
				}),
		);
		const set = mock(async () => undefined);
		globalThis.chrome = {
			storage: { local: { get, set } },
		} as unknown as typeof chrome;

		const firstCheck = checkAndRecordReviewPrompt();
		const secondCheck = checkAndRecordReviewPrompt();
		expect(firstCheck).toBe(secondCheck);
		resolveRead?.({
			[LOCAL_STORAGE.installedDate]: "2020-01-01T00:00:00Z",
			[LOCAL_STORAGE.reviewTimesAsked]: 2,
			[LOCAL_STORAGE.reviewLastAskedAt]: "2020-01-01T00:00:00Z",
		});

		await expect(Promise.all([firstCheck, secondCheck])).resolves.toEqual([
			true,
			true,
		]);
		expect(get).toHaveBeenCalledTimes(1);
		expect(set).toHaveBeenCalledTimes(1);
		expect(set).toHaveBeenCalledWith({
			[LOCAL_STORAGE.reviewLastAskedAt]: expect.any(String),
			[LOCAL_STORAGE.reviewTimesAsked]: 3,
		});
	});

	test("does not write when the prompt is not due", async () => {
		const get = mock(async () => ({
			[LOCAL_STORAGE.installedDate]: new Date().toString(),
			[LOCAL_STORAGE.reviewTimesAsked]: 0,
		}));
		const set = mock(async () => undefined);
		globalThis.chrome = {
			storage: { local: { get, set } },
		} as unknown as typeof chrome;

		await expect(checkAndRecordReviewPrompt()).resolves.toBe(false);
		expect(set).not.toHaveBeenCalled();
	});

	test("clears the in-flight check after a storage failure", async () => {
		const get = mock(async () => {
			throw new Error("storage unavailable");
		});
		globalThis.chrome = {
			storage: { local: { get } },
		} as unknown as typeof chrome;

		await expect(checkAndRecordReviewPrompt()).rejects.toThrow(
			"storage unavailable",
		);
		await expect(checkAndRecordReviewPrompt()).rejects.toThrow(
			"storage unavailable",
		);
		expect(get).toHaveBeenCalledTimes(2);
	});

	test("clears the in-flight check after a storage write fails", async () => {
		const get = mock(async () => ({
			[LOCAL_STORAGE.installedDate]: "2020-01-01T00:00:00Z",
			[LOCAL_STORAGE.reviewTimesAsked]: 0,
		}));
		const set = mock(async () => {
			throw new Error("storage write failed");
		});
		globalThis.chrome = {
			storage: { local: { get, set } },
		} as unknown as typeof chrome;

		await expect(checkAndRecordReviewPrompt()).rejects.toThrow(
			"storage write failed",
		);
		await expect(checkAndRecordReviewPrompt()).rejects.toThrow(
			"storage write failed",
		);
		expect(get).toHaveBeenCalledTimes(2);
		expect(set).toHaveBeenCalledTimes(2);
	});
});
