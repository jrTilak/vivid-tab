import { beforeEach, describe, expect, mock, spyOn, test } from "@test/jest";
import { LOCAL_STORAGE } from "@/constants/keys";
import {
	buildQuoteUrl,
	isCachedQuoteFresh,
	loadQuote,
	parseCachedQuote,
	parseQuote,
} from "./quote-service";

const quote = { _id: "one", author: "Author", content: "Quote" };
const storageGet = mock(async () => ({}));
const storageSet = mock(async (_values: Record<string, unknown>) => undefined);
const fetchMock = mock(
	async (_input: RequestInfo | URL, _init?: RequestInit) =>
		new Response(JSON.stringify([quote]), {
			headers: { "content-type": "application/json" },
			status: 200,
		}),
);

beforeEach(() => {
	storageGet.mockReset();
	storageGet.mockResolvedValue({});
	storageSet.mockReset();
	storageSet.mockResolvedValue(undefined);
	fetchMock.mockReset();
	fetchMock.mockResolvedValue(
		new Response(JSON.stringify([quote]), {
			headers: { "content-type": "application/json" },
			status: 200,
		}),
	);
	globalThis.chrome = {
		storage: { local: { get: storageGet, set: storageSet } },
	} as unknown as typeof chrome;
	globalThis.fetch = fetchMock as unknown as typeof fetch;
});

describe("quote service", () => {
	test("validates cached quote data", () => {
		expect(parseQuote(JSON.stringify(quote))).toEqual(quote);
		expect(parseQuote("not-json")).toBeNull();
		expect(parseQuote({ content: "Missing fields" })).toBeNull();
	});

	test("supports legacy cache entries and expires timestamped entries", () => {
		const legacy = parseCachedQuote(JSON.stringify(quote));
		const current = parseCachedQuote(
			JSON.stringify({ ...quote, fetchedAt: 1_000 }),
		);

		expect(legacy).toEqual({ quote });
		expect(legacy && isCachedQuoteFresh(legacy, "science", 1_001)).toBe(false);
		expect(current && isCachedQuoteFresh(current, "science", 2_000)).toBe(
			false,
		);
		expect(parseCachedQuote("not-json")).toBeNull();
	});

	test("uses a fresh quote only for the same category selection", () => {
		const cached = parseCachedQuote(
			JSON.stringify({
				_id: "one",
				author: "Author",
				categoriesKey: "science",
				content: "Quote",
				fetchedAt: 1_000,
			}),
		);

		expect(cached && isCachedQuoteFresh(cached, "science", 2_000)).toBe(true);
		expect(cached && isCachedQuoteFresh(cached, "history", 2_000)).toBe(false);
		expect(cached && isCachedQuoteFresh(cached, "science", 3_700_001)).toBe(
			false,
		);
	});

	test("encodes categories in the request URL", () => {
		const url = new URL(buildQuoteUrl(["science", "self help"]));

		expect(url.searchParams.get("tags")).toBe("science|self help");
		expect(url.searchParams.get("maxLength")).toBe("80");
	});

	test("returns a fresh category-specific cache without fetching", async () => {
		storageGet.mockResolvedValue({
			[LOCAL_STORAGE.quote]: JSON.stringify({
				...quote,
				categoriesKey: "science|wisdom",
				fetchedAt: Date.now(),
			}),
		});

		await expect(
			loadQuote(["wisdom", "science"], new AbortController().signal),
		).resolves.toEqual(quote);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	test("fetches, validates, and caches a stale or missing quote", async () => {
		await expect(
			loadQuote(["self help"], new AbortController().signal),
		).resolves.toEqual(quote);

		const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
		expect(requestUrl.searchParams.get("tags")).toBe("self help");
		expect(storageSet).toHaveBeenCalledTimes(1);
		const writtenValue = storageSet.mock.calls[0]?.[0] as Record<
			string,
			string
		>;
		const cached = JSON.parse(writtenValue[LOCAL_STORAGE.quote]);
		expect(cached).toMatchObject({ ...quote, categoriesKey: "self help" });
		expect(typeof cached.fetchedAt).toBe("number");
	});

	test("falls back to any validated stale cache when refresh fails", async () => {
		storageGet.mockResolvedValue({
			[LOCAL_STORAGE.quote]: JSON.stringify(quote),
		});
		fetchMock.mockResolvedValueOnce(
			new Response("unavailable", { status: 503 }),
		);

		await expect(
			loadQuote(["science"], new AbortController().signal),
		).resolves.toEqual(quote);
	});

	test("rejects invalid responses when no fallback exists", async () => {
		fetchMock.mockResolvedValueOnce(
			new Response(JSON.stringify([{ content: "missing fields" }]), {
				status: 200,
			}),
		);

		await expect(loadQuote([], new AbortController().signal)).rejects.toThrow(
			"invalid data",
		);
	});

	test("does not hide a fetched quote when cache storage fails", async () => {
		storageSet.mockRejectedValueOnce(new Error("quota exceeded"));
		const warn = spyOn(console, "warn").mockImplementation(() => undefined);

		await expect(loadQuote([], new AbortController().signal)).resolves.toEqual(
			quote,
		);
		expect(warn).toHaveBeenCalledTimes(1);
		warn.mockRestore();
	});

	test("continues without a readable cache and honors cancellation", async () => {
		storageGet.mockRejectedValueOnce(new Error("storage unavailable"));
		const warn = spyOn(console, "warn").mockImplementation(() => undefined);

		await expect(loadQuote([], new AbortController().signal)).resolves.toEqual(
			quote,
		);
		expect(warn).toHaveBeenCalledTimes(1);
		warn.mockRestore();

		const controller = new AbortController();
		controller.abort();
		await expect(loadQuote([], controller.signal)).rejects.toHaveProperty(
			"name",
			"AbortError",
		);
	});
});
