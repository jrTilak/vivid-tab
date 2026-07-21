import * as z from "zod/mini";
import { LOCAL_STORAGE } from "@/constants/keys";

const QuoteSchema = z.object({
	_id: z.string(),
	content: z.string(),
	author: z.string(),
});

const QuoteListSchema = z.array(QuoteSchema);
const CachedQuoteSchema = z.extend(QuoteSchema, {
	categoriesKey: z.string(),
	fetchedAt: z.number(),
});

const QUOTE_CACHE_DURATION_MS = 60 * 60 * 1000;

type QuoteData = z.infer<typeof QuoteSchema>;

const parseQuote = (value: unknown): QuoteData | null => {
	try {
		const candidate = typeof value === "string" ? JSON.parse(value) : value;
		const parsed = z.safeParse(QuoteSchema, candidate);

		return parsed.success ? parsed.data : null;
	} catch {
		return null;
	}
};

/**
 * @todo Bundle a curated, licensed quote catalog and select quotes locally so
 * New Tab no longer depends on the availability of the Quotable API.
 */
const buildQuoteUrl = (categories: readonly string[]): string => {
	const url = new URL("https://api.quotable.io/quotes/random");
	url.searchParams.set("maxLength", "80");

	if (categories.length > 0) {
		url.searchParams.set("tags", categories.join("|"));
	}

	return url.toString();
};

interface CachedQuote {
	categoriesKey?: string;
	fetchedAt?: number;
	quote: QuoteData;
}

const parseCachedQuote = (value: unknown): CachedQuote | null => {
	try {
		const candidate = typeof value === "string" ? JSON.parse(value) : value;
		const cached = z.safeParse(CachedQuoteSchema, candidate);
		if (cached.success) {
			const { categoriesKey, fetchedAt, ...quote } = cached.data;

			return { categoriesKey, fetchedAt, quote };
		}

		/**
		 * @deprecated Bare quote-cache records are supported only through v1.4.0;
		 * remove this fallback in v1.5.0.
		 */
		const legacyQuote = parseQuote(candidate);

		return legacyQuote ? { quote: legacyQuote } : null;
	} catch {
		return null;
	}
};

const isCachedQuoteFresh = (
	cachedQuote: CachedQuote,
	categoriesKey: string,
	now = Date.now(),
): boolean =>
	cachedQuote.categoriesKey === categoriesKey &&
	cachedQuote.fetchedAt !== undefined &&
	now - cachedQuote.fetchedAt < QUOTE_CACHE_DURATION_MS;

const readCachedQuote = async (): Promise<CachedQuote | null> => {
	try {
		const result = await chrome.storage.local.get(LOCAL_STORAGE.quote);

		return parseCachedQuote(result[LOCAL_STORAGE.quote]);
	} catch (error) {
		console.warn("Unable to read the cached quote:", error);
		return null;
	}
};

const saveCachedQuote = async (
	quote: QuoteData,
	categoriesKey: string,
): Promise<void> => {
	await chrome.storage.local.set({
		[LOCAL_STORAGE.quote]: JSON.stringify({
			...quote,
			categoriesKey,
			fetchedAt: Date.now(),
		}),
	});
};

const fetchQuote = async (
	categories: readonly string[],
	signal: AbortSignal,
): Promise<QuoteData> => {
	const response = await fetch(buildQuoteUrl(categories), { signal });
	if (!response.ok) throw new Error("Failed to fetch a quote");

	const parsed = z.safeParse(QuoteListSchema, await response.json());
	const quote = parsed.success ? parsed.data[0] : undefined;
	if (!quote) throw new Error("The quote service returned invalid data");

	return quote;
};

/** Fetches a fresh quote and falls back to the last validated cached quote. */
const loadQuote = async (
	categories: readonly string[],
	signal: AbortSignal,
): Promise<QuoteData> => {
	const categoriesKey = [...categories].sort().join("|");
	const cachedQuote = await readCachedQuote();
	signal.throwIfAborted();
	if (cachedQuote && isCachedQuoteFresh(cachedQuote, categoriesKey)) {
		return cachedQuote.quote;
	}

	try {
		const quote = await fetchQuote(categories, signal);
		try {
			await saveCachedQuote(quote, categoriesKey);
		} catch (error) {
			// Cache availability must not hide a successfully fetched quote.
			console.warn("Unable to cache the latest quote:", error);
		}

		return quote;
	} catch (error) {
		if (signal.aborted) throw error;

		if (cachedQuote) return cachedQuote.quote;

		throw error;
	}
};

export type { QuoteData };
export {
	buildQuoteUrl,
	isCachedQuoteFresh,
	loadQuote,
	parseCachedQuote,
	parseQuote,
};
