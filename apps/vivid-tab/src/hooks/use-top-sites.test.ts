import { afterEach, describe, expect, mock, test } from "@test/jest";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { useTopSites } from "./use-top-sites";

const originalChromeDescriptor = Object.getOwnPropertyDescriptor(
	globalThis,
	"chrome",
);

const installChrome = (value: unknown) => {
	Object.defineProperty(globalThis, "chrome", {
		configurable: true,
		value,
		writable: true,
	});
};

afterEach(() => {
	cleanup();
	mock.restore();
	if (originalChromeDescriptor) {
		Object.defineProperty(globalThis, "chrome", originalChromeDescriptor);
	} else {
		Reflect.deleteProperty(globalThis, "chrome");
	}
});

describe("useTopSites", () => {
	test("does not query the browser while disabled", () => {
		const get = mock(() => undefined);
		installChrome({ topSites: { get } });

		const { result } = renderHook(() => useTopSites(false));

		expect(result.current).toEqual([]);
		expect(get).not.toHaveBeenCalled();
	});

	test("returns at most thirty entries without mutating the browser result", async () => {
		const sites = Array.from({ length: 31 }, (_, index) => ({
			title: `Site ${index}`,
			url: `https://example.com/${index}`,
		}));
		const get = mock(
			(callback: (items: chrome.topSites.MostVisitedURL[]) => void) =>
				callback(sites),
		);
		installChrome({ topSites: { get } });

		const { result } = renderHook(() => useTopSites());

		await waitFor(() => expect(result.current).toHaveLength(30));
		expect(result.current[0]).toEqual(sites[0]);
		expect(result.current[29]).toEqual(sites[29]);
		expect(sites).toHaveLength(31);
	});

	test("handles an empty browser response", () => {
		const get = mock(
			(callback: (items?: chrome.topSites.MostVisitedURL[]) => void) =>
				callback(undefined),
		);
		installChrome({ topSites: { get } });

		const { result } = renderHook(() => useTopSites());

		expect(result.current).toEqual([]);
	});
});
