import {
	afterEach,
	beforeEach,
	describe,
	expect,
	mock,
	test,
} from "@test/jest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { useQuote } from "./use-quote";

const quote = { _id: "one", author: "Author", content: "Quote" };
const storageGet = mock(async () => ({}));
const storageSet = mock(async (_values: Record<string, unknown>) => undefined);
const fetchMock = mock(
	async (_input: RequestInfo | URL, _init?: RequestInit) =>
		new Response(JSON.stringify([quote])),
);

beforeEach(() => {
	storageGet.mockReset();
	storageGet.mockResolvedValue({});
	storageSet.mockReset();
	storageSet.mockResolvedValue(undefined);
	fetchMock.mockReset();
	fetchMock.mockResolvedValue(new Response(JSON.stringify([quote])));
	globalThis.chrome = {
		storage: { local: { get: storageGet, set: storageSet } },
	} as unknown as typeof chrome;
	globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
	cleanup();
	mock.restore();
});

describe("useQuote", () => {
	test("moves from loading to a validated quote", async () => {
		const { result, rerender } = renderHook(
			({ categories }) => useQuote(categories),
			{ initialProps: { categories: ["science"] } },
		);

		expect(result.current).toEqual({ isLoading: true, quote: null });
		await waitFor(() =>
			expect(result.current).toEqual({ isLoading: false, quote }),
		);

		rerender({ categories: ["science"] });
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	test("settles with no quote after an unrecoverable request failure", async () => {
		fetchMock.mockResolvedValueOnce(new Response("down", { status: 503 }));
		const { result } = renderHook(() => useQuote([]));

		await waitFor(() =>
			expect(result.current).toEqual({ isLoading: false, quote: null }),
		);
	});

	test("returns to loading instead of showing a quote from old categories", async () => {
		const { result, rerender, unmount } = renderHook(
			({ categories }) => useQuote(categories),
			{ initialProps: { categories: ["science"] } },
		);
		await waitFor(() => expect(result.current.quote).toEqual(quote));

		fetchMock.mockImplementationOnce((_input, init) => {
			const signal = init?.signal as AbortSignal;
			return new Promise<Response>((_resolve, reject) => {
				signal.addEventListener(
					"abort",
					() => reject(new DOMException("Aborted", "AbortError")),
					{ once: true },
				);
			});
		});
		rerender({ categories: ["wisdom"] });

		expect(result.current).toEqual({ isLoading: true, quote: null });
		unmount();
	});

	test("aborts obsolete category requests and the active request on unmount", async () => {
		const signals: AbortSignal[] = [];
		fetchMock.mockImplementation((_input, init) => {
			const signal = init?.signal as AbortSignal;
			signals.push(signal);

			return new Promise<Response>((_resolve, reject) => {
				signal.addEventListener(
					"abort",
					() => reject(new DOMException("Aborted", "AbortError")),
					{ once: true },
				);
			});
		});
		const { rerender, unmount } = renderHook(
			({ categories }) => useQuote(categories),
			{ initialProps: { categories: ["science"] } },
		);
		await waitFor(() => expect(signals).toHaveLength(1));

		rerender({ categories: ["wisdom"] });
		await waitFor(() => expect(signals).toHaveLength(2));
		expect(signals[0]?.aborted).toBe(true);

		act(() => unmount());
		expect(signals[1]?.aborted).toBe(true);
	});
});
