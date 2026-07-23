import { afterEach, describe, expect, jest, mock, test } from "@test/jest";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { createElement, type PropsWithChildren } from "react";
import { LAST_WALLPAPER_CHANGED_AT } from "@/constants/keys";
import {
	createDefaultSettings,
	SETTINGS_STORAGE_KEY,
	serializeSettings,
} from "@/lib/settings-storage";
import { SettingsProvider, useSettings } from "@/providers/settings-provider";
import type { Settings } from "@/zod/settings";
import { useNextWallpaper } from "./use-next-wallpaper";

type StorageChangeListener = (
	changes: Record<string, chrome.storage.StorageChange>,
	areaName: string,
) => void;

const originalChromeDescriptor = Object.getOwnPropertyDescriptor(
	globalThis,
	"chrome",
);
const originalIndexedDbDescriptor = Object.getOwnPropertyDescriptor(
	globalThis,
	"indexedDB",
);

const createSettings = ({
	images = [],
	randomizeWallpaper = "off",
	selectedImageId = null,
}: {
	images?: string[];
	randomizeWallpaper?: Settings["appearance"]["background"]["randomizeWallpaper"];
	selectedImageId?: string | null;
} = {}): Settings => {
	const settings = createDefaultSettings();
	settings.appearance.wallpapers.images = images;
	settings.appearance.wallpapers.selectedImageId = selectedImageId;
	settings.appearance.background.randomizeWallpaper = randomizeWallpaper;

	return settings;
};

const installWallpaperBrowser = ({
	lastChangedAt,
	localSetError,
	settings,
}: {
	lastChangedAt?: unknown;
	localSetError?: Error;
	settings: Settings;
}) => {
	const storageListeners = new Set<StorageChangeListener>();
	let storedLastChangedAt = lastChangedAt;
	const localGet = mock(async () =>
		storedLastChangedAt === undefined
			? {}
			: { [LAST_WALLPAPER_CHANGED_AT]: storedLastChangedAt },
	);
	const localSet = mock(async (values: Record<string, unknown>) => {
		if (localSetError) throw localSetError;
		if (LAST_WALLPAPER_CHANGED_AT in values) {
			storedLastChangedAt = values[LAST_WALLPAPER_CHANGED_AT];
		}
	});
	const syncSet = mock(async () => undefined);
	Object.defineProperty(globalThis, "chrome", {
		configurable: true,
		value: {
			storage: {
				local: {
					get: localGet,
					remove: mock(async () => undefined),
					set: localSet,
				},
				onChanged: {
					addListener: (listener: StorageChangeListener) =>
						storageListeners.add(listener),
					removeListener: (listener: StorageChangeListener) =>
						storageListeners.delete(listener),
				},
				sync: {
					get: mock(async () => ({
						[SETTINGS_STORAGE_KEY]: serializeSettings(settings),
					})),
					remove: mock(async () => undefined),
					set: syncSet,
				},
			},
		},
		writable: true,
	});

	/* Wallpaper selection tests do not need image contents; fail the DB read quietly. */
	Object.defineProperty(globalThis, "indexedDB", {
		configurable: true,
		value: {
			open: mock(() => {
				const request: { error: Error; onerror?: () => void } = {
					error: new Error("No test image database"),
				};
				queueMicrotask(() => request.onerror?.());
				return request;
			}),
		},
		writable: true,
	});

	return { localGet, localSet, storageListeners, syncSet };
};

const Wrapper = ({ children }: PropsWithChildren) =>
	createElement(SettingsProvider, { children, ensureRootFolder: false });

afterEach(() => {
	cleanup();
	mock.restore();
	if (originalChromeDescriptor) {
		Object.defineProperty(globalThis, "chrome", originalChromeDescriptor);
	} else {
		Reflect.deleteProperty(globalThis, "chrome");
	}
	if (originalIndexedDbDescriptor) {
		Object.defineProperty(globalThis, "indexedDB", originalIndexedDbDescriptor);
	} else {
		Reflect.deleteProperty(globalThis, "indexedDB");
	}
});

describe("useNextWallpaper", () => {
	test("does nothing when the gallery is empty", async () => {
		const browser = installWallpaperBrowser({ settings: createSettings() });
		const { result } = renderHook(() => useNextWallpaper(), {
			wrapper: Wrapper,
		});
		await waitFor(() => expect(result.current).not.toBeNull());

		expect(result.current.hasWallpapers).toBe(false);
		result.current.nextWallpaper();
		expect(browser.localSet).not.toHaveBeenCalled();
	});

	test("persists the timestamp before selecting a different image", async () => {
		jest.spyOn(Math, "random").mockReturnValue(0);
		const browser = installWallpaperBrowser({
			settings: createSettings({
				images: ["first", "second"],
				selectedImageId: "first",
			}),
		});
		const { result } = renderHook(
			() => ({ next: useNextWallpaper(), settings: useSettings().settings }),
			{ wrapper: Wrapper },
		);
		await waitFor(() => expect(result.current).not.toBeNull());

		expect(result.current.next.hasWallpapers).toBe(true);
		result.current.next.nextWallpaper();
		await waitFor(() =>
			expect(
				result.current.settings.appearance.wallpapers.selectedImageId,
			).toBe("second"),
		);
		expect(browser.localSet).toHaveBeenCalledWith({
			[LAST_WALLPAPER_CHANGED_AT]: expect.any(String),
		});
	});

	test("keeps the current selection when timestamp persistence fails", async () => {
		const consoleError = jest
			.spyOn(console, "error")
			.mockImplementation(() => undefined);
		installWallpaperBrowser({
			localSetError: new Error("Storage unavailable"),
			settings: createSettings({
				images: ["first", "second"],
				selectedImageId: "first",
			}),
		});
		const { result } = renderHook(
			() => ({ next: useNextWallpaper(), settings: useSettings().settings }),
			{ wrapper: Wrapper },
		);
		await waitFor(() => expect(result.current).not.toBeNull());

		result.current.next.nextWallpaper();
		await waitFor(() => expect(consoleError).toHaveBeenCalledTimes(1));
		expect(result.current.settings.appearance.wallpapers.selectedImageId).toBe(
			"first",
		);
	});
});
