import { afterEach, describe, expect, mock, test } from "@test/jest";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { useSearchSuggestions } from "./use-search-suggestions";

const originalFetch = globalThis.fetch;
const originalBrowserName = process.env.PLASMO_PUBLIC_BROWSER_NAME;
type FetchImplementation = (
	input: RequestInfo | URL,
	init?: RequestInit,
) => Promise<Response>;

const installFetch = (implementation: FetchImplementation) => {
	const fetchMock = mock(implementation);
	globalThis.fetch = Object.assign(fetchMock, {
		preconnect: originalFetch.preconnect,
	});

	return fetchMock;
};

afterEach(() => {
	cleanup();
	globalThis.fetch = originalFetch;
	if (originalBrowserName === undefined) {
		Reflect.deleteProperty(process.env, "PLASMO_PUBLIC_BROWSER_NAME");
	} else {
		Reflect.set(process.env, "PLASMO_PUBLIC_BROWSER_NAME", originalBrowserName);
	}
	mock.restore();
});

describe("useSearchSuggestions", () => {
	test("never transmits typed text in Firefox", () => {
		Reflect.set(process.env, "PLASMO_PUBLIC_BROWSER_NAME", "firefox");
		const fetchMock = installFetch((_input) => Promise.resolve(new Response()));

		const { result } = renderHook(() =>
			useSearchSuggestions({ enabled: true, query: "private query" }),
		);

		expect(result.current).toEqual([]);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	test("does not request disabled or blank queries", () => {
		const fetchMock = installFetch((_input) => Promise.resolve(new Response()));
		const { result, rerender } = renderHook(
			({ enabled, query }) => useSearchSuggestions({ enabled, query }),
			{ initialProps: { enabled: true, query: "   " } },
		);

		expect(result.current).toEqual([]);
		rerender({ enabled: false, query: "vivid" });
		expect(result.current).toEqual([]);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	test("loads and validates suggestions for a trimmed query", async () => {
		const fetchMock = installFetch((_input, _init) =>
			Promise.resolve(
				new Response(JSON.stringify(["vivid", [" Vivid Tab ", 3, "Vivid"]])),
			),
		);

		const { result } = renderHook(() =>
			useSearchSuggestions({ query: "  vivid tab  " }),
		);

		await waitFor(() => expect(result.current).toEqual(["Vivid Tab", "Vivid"]));
		const [requestUrl, requestInit] = fetchMock.mock.calls[0] ?? [];
		expect(new URL(String(requestUrl)).searchParams.get("q")).toBe("vivid tab");
		expect(requestInit?.signal).toBeInstanceOf(AbortSignal);
	});

	test("returns an empty list for HTTP, parsing, and network failures", async () => {
		const fetchMock = installFetch((input) => {
			const query = new URL(String(input)).searchParams.get("q");
			if (query === "http") {
				return Promise.resolve(new Response(null, { status: 503 }));
			}
			if (query === "json") {
				return Promise.resolve(new Response("not-json"));
			}
			return Promise.reject(new Error("offline"));
		});
		const { result, rerender } = renderHook(
			({ query }) => useSearchSuggestions({ query }),
			{ initialProps: { query: "http" } },
		);

		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
		rerender({ query: "json" });
		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
		rerender({ query: "network" });
		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
		expect(result.current).toEqual([]);
	});

	test("aborts a stale request and cannot publish its late response", async () => {
		let resolveFirst: ((response: Response) => void) | undefined;
		let firstSignal: AbortSignal | null | undefined;
		installFetch((input, init) => {
			const query = new URL(String(input)).searchParams.get("q");
			if (query === "first") {
				firstSignal = init?.signal;
				return new Promise<Response>((resolve) => {
					resolveFirst = resolve;
				});
			}

			return Promise.resolve(
				new Response(JSON.stringify(["second", ["new result"]])),
			);
		});
		const { result, rerender } = renderHook(
			({ query }) => useSearchSuggestions({ query }),
			{ initialProps: { query: "first" } },
		);

		await waitFor(() => expect(resolveFirst).toBeDefined());
		rerender({ query: "second" });
		await waitFor(() => expect(result.current).toEqual(["new result"]));
		expect(firstSignal?.aborted).toBe(true);

		resolveFirst?.(new Response(JSON.stringify(["first", ["stale result"]])));
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(result.current).toEqual(["new result"]);
	});

	test("ignores a stale rejection after its request is aborted", async () => {
		let rejectFirst: ((error: Error) => void) | undefined;
		let firstSignal: AbortSignal | null | undefined;
		installFetch((input, init) => {
			const query = new URL(String(input)).searchParams.get("q");
			if (query === "first") {
				firstSignal = init?.signal;
				return new Promise<Response>((_resolve, reject) => {
					rejectFirst = reject;
				});
			}

			return Promise.resolve(
				new Response(JSON.stringify(["second", ["new result"]])),
			);
		});
		const { result, rerender } = renderHook(
			({ query }) => useSearchSuggestions({ query }),
			{ initialProps: { query: "first" } },
		);

		await waitFor(() => expect(rejectFirst).toBeDefined());
		rerender({ query: "second" });
		await waitFor(() => expect(result.current).toEqual(["new result"]));
		expect(firstSignal?.aborted).toBe(true);

		rejectFirst?.(new DOMException("Request aborted", "AbortError"));
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(result.current).toEqual(["new result"]);
	});
});
