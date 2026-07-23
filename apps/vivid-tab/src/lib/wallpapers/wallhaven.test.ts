import { afterEach, describe, expect, mock, spyOn, test } from "@test/jest";
import { DEFAULT_SEARCH_TERMS } from "@/constants/wallpapers";
import { Wallhaven } from "./wallhaven";

const originalFetch = globalThis.fetch;
const originalRandom = Math.random;
const originalDateNow = Date.now;

afterEach(() => {
	globalThis.fetch = originalFetch;
	Math.random = originalRandom;
	Date.now = originalDateNow;
});

describe("Wallhaven requests", () => {
	test("uses safe defaults when no useful keywords are configured", async () => {
		Math.random = mock(() => 0);
		const fetchMock = mock(async (_input: RequestInfo | URL) =>
			Response.json({ data: [] }),
		);
		globalThis.fetch = fetchMock as unknown as typeof fetch;
		const provider = new Wallhaven();

		expect(provider.sourceName).toBe("wallhaven");
		await expect(provider.fetchImages()).resolves.toEqual([]);
		await expect(provider.fetchImages([])).resolves.toEqual([]);
		await expect(provider.fetchImages([" ", ""])).resolves.toEqual([]);

		expect(fetchMock).toHaveBeenCalledTimes(3);
		for (const [request] of fetchMock.mock.calls) {
			expect(new URL(String(request)).searchParams.get("q")).toBe(
				DEFAULT_SEARCH_TERMS[0],
			);
		}
	});

	test("falls back to the first term if a random index is unavailable", async () => {
		const randomValues = [Number.NaN, 0];
		Math.random = mock(() => randomValues.shift() ?? 0);
		const fetchMock = mock(async (_input: RequestInfo | URL) =>
			Response.json({ data: [] }),
		);
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		await new Wallhaven().fetchImages(["space", "city"]);

		expect(
			new URL(String(fetchMock.mock.calls[0]?.[0])).searchParams.get("q"),
		).toBe("space");
	});

	test("maps the upper random boundary to the final term and page", async () => {
		Math.random = mock(() => 0.999_999);
		const fetchMock = mock(async (_input: RequestInfo | URL) =>
			Response.json({ data: [] }),
		);
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		await new Wallhaven().fetchImages(["anime", "comics"]);

		const firstRequest = new URL(String(fetchMock.mock.calls[0]?.[0]));
		expect(firstRequest.searchParams.get("q")).toBe("comics");
		expect(firstRequest.searchParams.get("page")).toBe("4");
	});

	test("normalizes configured keywords before choosing one", async () => {
		const randomValues = [0.999_999, 0];
		Math.random = mock(() => randomValues.shift() ?? 0);
		const fetchMock = mock(async (_input: RequestInfo | URL) =>
			Response.json({ data: [] }),
		);
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		await new Wallhaven().fetchImages([" Space ", "CITY", ""]);

		expect(
			new URL(String(fetchMock.mock.calls[0]?.[0])).searchParams.get("q"),
		).toBe("city");
	});

	test("builds an encoded SFW-only request URL", async () => {
		Math.random = mock(() => 0);
		Date.now = mock(() => 123_456);
		const fetchMock = mock(async (_input: RequestInfo | URL) =>
			Response.json({ data: [] }),
		);
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		await new Wallhaven().fetchImages(["super hero"]);

		const url = new URL(String(fetchMock.mock.calls[0]?.[0]));

		expect(url.origin + url.pathname).toBe(
			"https://wallhaven.cc/api/v1/search",
		);
		expect(url.searchParams.get("page")).toBe("1");
		expect(url.searchParams.get("purity")).toBe("100");
		expect(url.searchParams.get("q")).toBe("super hero");
		expect(url.searchParams.get("resolutions")).toBe("1920x1080");
		expect(url.searchParams.get("seed")).toBe("123456");
		expect(url.searchParams.get("sorting")).toBe("random");
	});

	test("validates API data and keeps lightweight gallery thumbnails", async () => {
		Math.random = mock(() => 0);
		globalThis.fetch = mock(async () =>
			Response.json({
				data: [
					{
						path: "https://w.wallhaven.cc/full/example.jpg",
						thumbs: {
							large: "https://th.wallhaven.cc/lg/example.jpg",
						},
					},
					{ path: 42 },
					{ path: "https://w.wallhaven.cc/full/no-thumbnail.jpg" },
					{
						path: "https://w.wallhaven.cc/full/invalid-thumbnail.jpg",
						thumbs: { large: "not-a-url" },
					},
				],
			}),
		) as unknown as typeof fetch;

		const images = await new Wallhaven().fetchImages(["anime"]);

		expect(images).toHaveLength(3);
		expect(images).toEqual(
			expect.arrayContaining([
				{
					src: "https://w.wallhaven.cc/full/example.jpg",
					thumbnailSrc: "https://th.wallhaven.cc/lg/example.jpg",
				},
				{
					src: "https://w.wallhaven.cc/full/no-thumbnail.jpg",
					thumbnailSrc: "https://w.wallhaven.cc/full/no-thumbnail.jpg",
				},
				{
					src: "https://w.wallhaven.cc/full/invalid-thumbnail.jpg",
					thumbnailSrc: "https://w.wallhaven.cc/full/invalid-thumbnail.jpg",
				},
			]),
		);

		globalThis.fetch = mock(async () =>
			Response.json(null),
		) as unknown as typeof fetch;
		await expect(new Wallhaven().fetchImages(["anime"])).resolves.toEqual([]);
	});

	test("fetches, validates, shuffles, and limits provider results", async () => {
		Math.random = mock(() => 0);
		const fetchMock = mock(async (_input: RequestInfo | URL) =>
			Response.json({
				data: [
					{ path: "https://wallhaven.cc/one.jpg" },
					{
						path: "https://wallhaven.cc/two.jpg",
						thumbs: { large: "https://wallhaven.cc/thumb-two.jpg" },
					},
				],
			}),
		);
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const images = await new Wallhaven().fetchImages([" Space "], 1);

		expect(images).toHaveLength(1);
		expect(images[0]).toEqual({
			src: "https://wallhaven.cc/two.jpg",
			thumbnailSrc: "https://wallhaven.cc/thumb-two.jpg",
		});
		const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
		expect(requestUrl.searchParams.get("q")).toBe("space");
		expect(requestUrl.searchParams.get("page")).toBe("1");
	});

	test("retries page one when a random later page is empty", async () => {
		const randomValues = [0, 0.99];
		Math.random = mock(() => randomValues.shift() ?? 0);
		const fetchMock = mock(async (_input: RequestInfo | URL) => {
			if (fetchMock.mock.calls.length === 1) {
				return Response.json({ data: [] });
			}

			return Response.json({
				data: [{ path: "https://wallhaven.cc/fallback.jpg" }],
			});
		});
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		await expect(new Wallhaven().fetchImages(["anime"])).resolves.toEqual([
			{
				src: "https://wallhaven.cc/fallback.jpg",
				thumbnailSrc: "https://wallhaven.cc/fallback.jpg",
			},
		]);
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(
			new URL(String(fetchMock.mock.calls[0]?.[0])).searchParams.get("page"),
		).toBe("4");
		expect(
			new URL(String(fetchMock.mock.calls[1]?.[0])).searchParams.get("page"),
		).toBe("1");
	});

	test("returns an empty list for HTTP and network failures", async () => {
		Math.random = mock(() => 0);
		globalThis.fetch = mock(
			async () => new Response(null, { status: 503 }),
		) as unknown as typeof fetch;
		await expect(new Wallhaven().fetchImages(["anime"])).resolves.toEqual([]);

		const consoleError = spyOn(console, "error").mockImplementation(
			() => undefined,
		);
		globalThis.fetch = mock(async () => {
			throw new Error("offline");
		}) as unknown as typeof fetch;
		await expect(new Wallhaven().fetchImages(["anime"])).resolves.toEqual([]);
		expect(consoleError).toHaveBeenCalledTimes(1);
		consoleError.mockRestore();
	});

	test("honors a non-positive requested count", async () => {
		Math.random = mock(() => 0);
		globalThis.fetch = mock(async () =>
			Response.json({
				data: [{ path: "https://wallhaven.cc/one.jpg" }],
			}),
		) as unknown as typeof fetch;

		await expect(new Wallhaven().fetchImages(["anime"], -1)).resolves.toEqual(
			[],
		);
	});
});
