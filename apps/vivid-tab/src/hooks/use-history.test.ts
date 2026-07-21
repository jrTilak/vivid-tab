import { afterEach, describe, expect, mock, test } from "@test/jest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { useHistory } from "./use-history";

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

describe("useHistory", () => {
	test("does not check permission or search while disabled", () => {
		const contains = mock(() => undefined);
		const search = mock(() => undefined);
		installChrome({
			history: { search },
			permissions: { contains, request: mock(() => undefined) },
		});

		const { result } = renderHook(() => useHistory(false));

		expect(result.current.history).toEqual([]);
		expect(result.current.hasPermission).toBe(false);
		expect(contains).not.toHaveBeenCalled();
		expect(search).not.toHaveBeenCalled();
	});

	test("reports a denied permission without reading history", async () => {
		const contains = mock(
			(
				_permissions: chrome.permissions.Permissions,
				callback: (granted: boolean) => void,
			) => callback(false),
		);
		const search = mock(() => undefined);
		installChrome({
			history: { search },
			permissions: { contains, request: mock(() => undefined) },
		});

		const { result } = renderHook(() => useHistory());

		await waitFor(() => expect(contains).toHaveBeenCalledTimes(1));
		expect(result.current.hasPermission).toBe(false);
		expect(result.current.history).toEqual([]);
		expect(search).not.toHaveBeenCalled();
	});

	test("maps permitted history and uses safe title fallbacks", async () => {
		const now = 1_753_088_400_000;
		const originalNow = Date.now;
		Date.now = () => now;
		const search = mock(
			(
				_query: chrome.history.HistoryQuery,
				callback: (items: chrome.history.HistoryItem[]) => void,
			) =>
				callback([
					{
						id: "one",
						lastVisitTime: 100,
						title: "Named",
						url: "https://one.example",
						visitCount: 2,
					},
					{
						id: "two",
						lastVisitTime: 200,
						title: "",
						url: "https://two.example",
						visitCount: 3,
					},
					{
						id: "three",
						lastVisitTime: 300,
						title: "",
						url: "",
						visitCount: 4,
					},
				]),
		);
		installChrome({
			history: { search },
			permissions: {
				contains: mock(
					(
						_permissions: chrome.permissions.Permissions,
						callback: (granted: boolean) => void,
					) => callback(true),
				),
				request: mock(() => undefined),
			},
		});

		try {
			const { result } = renderHook(() => useHistory());

			await waitFor(() => expect(result.current.history).toHaveLength(3));
			expect(result.current.hasPermission).toBe(true);
			expect(result.current.history.map(({ title }) => title)).toEqual([
				"Named",
				"https://two.example",
				"Untitled",
			]);
			expect(search.mock.calls[0]?.[0]).toEqual({
				endTime: now,
				maxResults: 30,
				startTime: 0,
				text: "",
			});
		} finally {
			Date.now = originalNow;
		}
	});

	test("requests permission and loads history only when granted", async () => {
		let grantPermission = false;
		const request = mock(
			(
				_permissions: chrome.permissions.Permissions,
				callback: (granted: boolean) => void,
			) => callback(grantPermission),
		);
		const search = mock(
			(
				_query: chrome.history.HistoryQuery,
				callback: (items: chrome.history.HistoryItem[]) => void,
			) =>
				callback([
					{
						id: "one",
						lastVisitTime: 100,
						title: "One",
						url: "https://one.example",
						visitCount: 1,
					},
				]),
		);
		installChrome({
			history: { search },
			permissions: {
				contains: mock(
					(
						_permissions: chrome.permissions.Permissions,
						callback: (granted: boolean) => void,
					) => callback(false),
				),
				request,
			},
		});
		const { result } = renderHook(() => useHistory());

		act(() => result.current.requestPermission());
		expect(result.current.hasPermission).toBe(false);
		expect(search).not.toHaveBeenCalled();

		grantPermission = true;
		act(() => result.current.requestPermission());
		await waitFor(() => expect(result.current.history).toHaveLength(1));
		expect(result.current.hasPermission).toBe(true);
		expect(request).toHaveBeenCalledTimes(2);
		expect(search).toHaveBeenCalledTimes(1);
	});

	test("normalizes an empty history callback", async () => {
		const search = mock(
			(
				_query: chrome.history.HistoryQuery,
				callback: (items?: chrome.history.HistoryItem[]) => void,
			) => callback(undefined),
		);
		installChrome({
			history: { search },
			permissions: {
				contains: mock(
					(
						_permissions: chrome.permissions.Permissions,
						callback: (granted: boolean) => void,
					) => callback(true),
				),
				request: mock(() => undefined),
			},
		});

		const { result } = renderHook(() => useHistory());

		await waitFor(() => expect(search).toHaveBeenCalledTimes(1));
		expect(result.current.history).toEqual([]);
	});
});
