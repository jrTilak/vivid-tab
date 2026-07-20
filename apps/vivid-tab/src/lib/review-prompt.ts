import { LOCAL_STORAGE } from "@/constants/keys";

const MAX_PROMPTS = 4;
const FIRST_PROMPT_DAYS = 7;
const REPEAT_PROMPT_DAYS = 90;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

type ReviewPromptState = {
	installedAt?: Date;
	lastAskedAt?: Date;
	timesAsked: number;
};

const parseDate = (value: unknown): Date | undefined => {
	if (typeof value !== "string" && typeof value !== "number") return undefined;

	const date = new Date(value);

	return Number.isNaN(date.getTime()) ? undefined : date;
};

export const parseReviewPromptState = (
	stored: Record<string, unknown>,
): ReviewPromptState => {
	const timesAsked = stored[LOCAL_STORAGE.reviewTimesAsked];

	return {
		installedAt: parseDate(stored[LOCAL_STORAGE.installedDate]),
		lastAskedAt: parseDate(stored[LOCAL_STORAGE.reviewLastAskedAt]),
		timesAsked: typeof timesAsked === "number" ? Math.max(0, timesAsked) : 0,
	};
};

export const shouldShowReviewPrompt = (state: ReviewPromptState, now: Date) => {
	if (!state.installedAt || state.timesAsked >= MAX_PROMPTS) return false;

	if (state.timesAsked === 0) {
		return (
			now.getTime() - state.installedAt.getTime() >=
			FIRST_PROMPT_DAYS * DAY_IN_MS
		);
	}

	return Boolean(
		state.lastAskedAt &&
			now.getTime() - state.lastAskedAt.getTime() >=
				REPEAT_PROMPT_DAYS * DAY_IN_MS,
	);
};

let promptCheckPromise: Promise<boolean> | undefined;

/** Atomically checks and records an automatic review prompt for this context. */
export const checkAndRecordReviewPrompt = () => {
	promptCheckPromise ??= (async () => {
		const result = await chrome.storage.local.get([
			LOCAL_STORAGE.installedDate,
			LOCAL_STORAGE.reviewLastAskedAt,
			LOCAL_STORAGE.reviewTimesAsked,
		]);
		const state = parseReviewPromptState(result);
		const now = new Date();

		if (!shouldShowReviewPrompt(state, now)) return false;

		await chrome.storage.local.set({
			[LOCAL_STORAGE.reviewLastAskedAt]: now.toString(),
			[LOCAL_STORAGE.reviewTimesAsked]: state.timesAsked + 1,
		});

		return true;
	})().finally(() => {
		promptCheckPromise = undefined;
	});

	return promptCheckPromise;
};
