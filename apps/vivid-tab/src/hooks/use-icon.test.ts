import { afterEach, describe, expect, mock, test } from "@test/jest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { getBookmarkIconStorageKey } from "@/lib/bookmarks";
import { useIcon } from "./use-icon";

type StorageChangeListener = (
	changes: Record<string, chrome.storage.StorageChange>,
	areaName: string,
) => void;

const createStorageEvent = () => {
	const listeners = new Set<StorageChangeListener>();

	return {
		addListener: (listener: StorageChangeListener) => listeners.add(listener),
		emit: (
			changes: Record<string, chrome.storage.StorageChange>,
			areaName: string,
		) => {
			for (const listener of listeners) listener(changes, areaName);
		},
		listenerCount: () => listeners.size,
		removeListener: (listener: StorageChangeListener) =>
			listeners.delete(listener),
	};
};

const originalChromeDescriptor = Object.getOwnPropertyDescriptor(
	globalThis,
	"chrome",
);

const installStorageChrome = (stored: Record<string, unknown> = {}) => {
	const onChanged = createStorageEvent();
	const get = mock(async (keys: string | string[]) => {
		const requestedKeys = Array.isArray(keys) ? keys : [keys];

		return Object.fromEntries(
			requestedKeys
				.filter((key) => stored[key] !== undefined)
				.map((key) => [key, stored[key]]),
		);
	});

	Object.defineProperty(globalThis, "chrome", {
		configurable: true,
		value: { storage: { local: { get }, onChanged } },
		writable: true,
	});

	return { get, onChanged };
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

describe("useIcon", () => {
	test("uses the fallback without subscribing when no bookmark id exists", () => {
		const { get, onChanged } = installStorageChrome();

		const { result } = renderHook(() =>
			useIcon({ defaultIcon: "fallback.svg" }),
		);

		expect(result.current.icon).toBe("fallback.svg");
		expect(get).not.toHaveBeenCalled();
		expect(onChanged.listenerCount()).toBe(0);
	});

	test("loads a stored icon and falls back when it is removed", async () => {
		const id = "icon-load-test";
		const key = getBookmarkIconStorageKey(id);
		const { onChanged } = installStorageChrome({
			[key]: { icon: "stored.svg" },
		});

		const { result } = renderHook(() =>
			useIcon({ defaultIcon: "fallback.svg", id }),
		);

		expect(result.current.icon).toBe("fallback.svg");
		await waitFor(() => expect(result.current.icon).toBe("stored.svg"));

		act(() =>
			onChanged.emit(
				{
					[key]: { oldValue: { icon: "stored.svg" }, newValue: undefined },
				},
				"local",
			),
		);
		expect(result.current.icon).toBe("fallback.svg");
	});

	test("batches icon reads started in the same render", async () => {
		const firstId = "icon-batch-first";
		const secondId = "icon-batch-second";
		const firstKey = getBookmarkIconStorageKey(firstId);
		const secondKey = getBookmarkIconStorageKey(secondId);
		const { get } = installStorageChrome({
			[firstKey]: { icon: "first.svg" },
			[secondKey]: { icon: "second.svg" },
		});

		const { result } = renderHook(() => [
			useIcon({ id: firstId }).icon,
			useIcon({ id: secondId }).icon,
		]);

		await waitFor(() =>
			expect(result.current).toEqual(["first.svg", "second.svg"]),
		);
		expect(get).toHaveBeenCalledTimes(1);
		expect(new Set(get.mock.calls[0]?.[0] as string[])).toEqual(
			new Set([firstKey, secondKey]),
		);
	});

	test("ignores non-local changes and detaches the shared listener", async () => {
		const id = "icon-listener-test";
		const key = getBookmarkIconStorageKey(id);
		const { onChanged } = installStorageChrome({
			[key]: { icon: "initial.svg" },
		});
		const { result, unmount } = renderHook(() => useIcon({ id }));

		await waitFor(() => expect(result.current.icon).toBe("initial.svg"));
		act(() =>
			onChanged.emit(
				{
					[key]: {
						oldValue: { icon: "initial.svg" },
						newValue: { icon: "ignored.svg" },
					},
				},
				"sync",
			),
		);
		expect(result.current.icon).toBe("initial.svg");
		expect(onChanged.listenerCount()).toBe(1);

		unmount();
		expect(onChanged.listenerCount()).toBe(0);
	});
});
