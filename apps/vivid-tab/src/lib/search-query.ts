import * as z from "zod/mini";

const URL_SCHEMA = z.url();
const NAVIGABLE_PROTOCOLS = new Set(["chrome:", "file:", "http:", "https:"]);

/**
 * Safe action produced from untrusted search-box input at the background boundary.
 */
export type SearchTarget =
	| { kind: "search"; query: string }
	| { kind: "url"; url: string };

const resolveHostLikeUrl = (query: string): string | undefined => {
	if (/\s/.test(query)) return undefined;

	try {
		const url = new URL(`https://${query}`);
		const labels = url.hostname.split(".");

		if (labels.length < 2 || labels.some((label) => label.length === 0)) {
			return undefined;
		}

		return url.href;
	} catch {
		return undefined;
	}
};

const resolveExplicitUrl = (query: string): string | undefined => {
	if (!z.safeParse(URL_SCHEMA, query).success) return undefined;

	const url = new URL(query);

	/* Never pass executable or embedded-data schemes to chrome.tabs.update. */
	return NAVIGABLE_PROTOCOLS.has(url.protocol) ? query : undefined;
};

/**
 * Resolves untrusted search-box input to safe navigation or browser search.
 * Fully qualified URLs retain their spelling, while domain-like input receives
 * HTTPS. Executable schemes and malformed values remain ordinary search text.
 *
 * @param rawQuery - Value received from the background message boundary.
 * @returns A discriminated target safe for Chrome's tabs or search APIs.
 */
export const resolveSearchTarget = (rawQuery: unknown): SearchTarget => {
	const query = typeof rawQuery === "string" ? rawQuery.trim() : "";
	const explicitUrl = resolveExplicitUrl(query);

	if (explicitUrl) {
		return { kind: "url", url: explicitUrl };
	}

	const hostLikeUrl = resolveHostLikeUrl(query);

	return hostLikeUrl
		? { kind: "url", url: hostLikeUrl }
		: { kind: "search", query };
};
