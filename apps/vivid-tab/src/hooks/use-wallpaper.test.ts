import { afterEach, describe, expect, jest, mock, test } from "@test/jest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { createElement, type PropsWithChildren } from "react";
import { LAST_WALLPAPER_CHANGED_AT } from "@/constants/keys";
import {
	createDefaultSettings,
	SETTINGS_STORAGE_KEY,
	serializeSettings,
} from "@/lib/settings-storage";
import { SettingsProvider, useSettings } from "@/providers/settings-provider";
import type { Settings } from "@/zod/settings";
import { useWallpaper } from "./use-wallpaper";

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

describe("useWallpaper", () => {
	test("uses the persisted selection when randomization is off", async () => {
		installWallpaperBrowser({
			settings: createSettings({
				images: ["selected"],
				selectedImageId: "selected",
			}),
		});
		const { result } = renderHook(() => useWallpaper(), { wrapper: Wrapper });

		await waitFor(() => expect(result.current?.activeImageId).toBe("selected"));
		expect(result.current.imageData).toBeNull();
	});

	test("selects a different session image for each-tab randomization", async () => {
		jest.spyOn(Math, "random").mockReturnValue(0);
		installWallpaperBrowser({
			settings: createSettings({
				images: ["first", "second"],
				randomizeWallpaper: "on-each-tab",
				selectedImageId: "first",
			}),
		});
		const { result } = renderHook(() => useWallpaper(), { wrapper: Wrapper });

		await waitFor(() => expect(result.current?.activeImageId).toBe("second"));
	});

	test("returns no active image for an empty randomized gallery", async () => {
		installWallpaperBrowser({
			settings: createSettings({ randomizeWallpaper: "on-each-tab" }),
		});
		const { result } = renderHook(() => useWallpaper(), { wrapper: Wrapper });

		await waitFor(() => expect(result.current).not.toBeNull());
		expect(result.current.activeImageId).toBeNull();
	});

	test("resynchronizes the session after selection and gallery changes", async () => {
		jest.spyOn(Math, "random").mockReturnValue(0);
		installWallpaperBrowser({
			settings: createSettings({
				images: ["first", "second", "third"],
				randomizeWallpaper: "on-each-tab",
				selectedImageId: "first",
			}),
		});
		const { result } = renderHook(
			() => ({
				settings: useSettings(),
				wallpaper: useWallpaper(),
			}),
			{ wrapper: Wrapper },
		);
		await waitFor(() =>
			expect(result.current?.wallpaper.activeImageId).toBe("second"),
		);

		act(() => {
			result.current.settings.setSettings((previous) => ({
				...previous,
				appearance: {
					...previous.appearance,
					wallpapers: {
						...previous.appearance.wallpapers,
						selectedImageId: "third",
					},
				},
			}));
		});
		await waitFor(() =>
			expect(result.current.wallpaper.activeImageId).toBe("third"),
		);

		act(() => {
			result.current.settings.setSettings((previous) => ({
				...previous,
				appearance: {
					...previous.appearance,
					wallpapers: {
						...previous.appearance.wallpapers,
						images: ["replacement"],
						selectedImageId: null,
					},
				},
			}));
		});
		await waitFor(() =>
			expect(result.current.wallpaper.activeImageId).toBe("replacement"),
		);
	});

	test("does not rotate before the hourly boundary", async () => {
		const now = 1_753_088_400_000;
		jest.spyOn(Date, "now").mockReturnValue(now);
		const browser = installWallpaperBrowser({
			lastChangedAt: String(now - 3_599_999),
			settings: createSettings({
				images: ["first", "second"],
				randomizeWallpaper: "hourly",
				selectedImageId: "first",
			}),
		});
		const { result } = renderHook(() => useWallpaper(), { wrapper: Wrapper });

		await waitFor(() => expect(browser.localGet).toHaveBeenCalledTimes(1));
		expect(result.current.activeImageId).toBe("first");
		expect(browser.localSet).not.toHaveBeenCalled();
	});

	test("rotates at the hourly boundary and persists before publishing", async () => {
		const now = 1_753_088_400_000;
		jest.spyOn(Date, "now").mockReturnValue(now);
		jest.spyOn(Math, "random").mockReturnValue(0);
		const browser = installWallpaperBrowser({
			lastChangedAt: String(now - 3_600_000),
			settings: createSettings({
				images: ["first", "second"],
				randomizeWallpaper: "hourly",
				selectedImageId: "first",
			}),
		});
		const { result } = renderHook(() => useWallpaper(), { wrapper: Wrapper });

		await waitFor(() => expect(result.current?.activeImageId).toBe("second"));
		expect(browser.localSet).toHaveBeenCalledWith({
			[LAST_WALLPAPER_CHANGED_AT]: expect.any(String),
		});
	});

	test("does not persist when the gallery has no usable next ID", async () => {
		const browser = installWallpaperBrowser({
			lastChangedAt: "0",
			settings: createSettings({
				images: [""],
				randomizeWallpaper: "hourly",
				selectedImageId: null,
			}),
		});
		const { result } = renderHook(() => useWallpaper(), { wrapper: Wrapper });

		await waitFor(() => expect(browser.localGet).toHaveBeenCalledTimes(1));
		await act(async () => Promise.resolve());

		expect(browser.localSet).not.toHaveBeenCalled();
		expect(result.current.activeImageId).toBeNull();
	});

	test("does not publish a rotation after pending persistence is cancelled", async () => {
		jest.spyOn(Math, "random").mockReturnValue(0);
		let finishPersistence: (() => void) | undefined;
		const browser = installWallpaperBrowser({
			lastChangedAt: "0",
			settings: createSettings({
				images: ["first", "second"],
				randomizeWallpaper: "hourly",
				selectedImageId: "first",
			}),
		});
		browser.localSet.mockImplementation(
			() =>
				new Promise<void>((resolve) => {
					finishPersistence = resolve;
				}),
		);
		const { result, unmount } = renderHook(() => useWallpaper(), {
			wrapper: Wrapper,
		});

		await waitFor(() => expect(finishPersistence).toBeDefined());
		unmount();
		await act(async () => {
			finishPersistence?.();
			await Promise.resolve();
		});

		expect(result.current.activeImageId).toBe("first");
		expect(browser.syncSet).not.toHaveBeenCalled();
	});

	test("logs a periodic rotation persistence failure and keeps the image", async () => {
		const now = 1_753_088_400_000;
		jest.spyOn(Date, "now").mockReturnValue(now);
		const storageError = new Error("Rotation timestamp could not be saved");
		const consoleError = jest
			.spyOn(console, "error")
			.mockImplementation(() => undefined);
		installWallpaperBrowser({
			lastChangedAt: String(now - 3_600_000),
			localSetError: storageError,
			settings: createSettings({
				images: ["first", "second"],
				randomizeWallpaper: "hourly",
				selectedImageId: "first",
			}),
		});
		const { result } = renderHook(() => useWallpaper(), { wrapper: Wrapper });

		await waitFor(() =>
			expect(consoleError).toHaveBeenCalledWith(
				"Failed to rotate the wallpaper:",
				storageError,
			),
		);
		expect(result.current.activeImageId).toBe("first");
	});

	test("suppresses a rotation read failure after disposal", async () => {
		let rejectTimestamp: ((error: Error) => void) | undefined;
		const consoleError = jest
			.spyOn(console, "error")
			.mockImplementation(() => undefined);
		const browser = installWallpaperBrowser({
			settings: createSettings({
				images: ["first", "second"],
				randomizeWallpaper: "hourly",
				selectedImageId: "first",
			}),
		});
		browser.localGet.mockImplementation(
			() =>
				new Promise((_resolve, reject) => {
					rejectTimestamp = reject;
				}),
		);
		const { unmount } = renderHook(() => useWallpaper(), { wrapper: Wrapper });
		await waitFor(() => expect(rejectTimestamp).toBeDefined());

		unmount();
		rejectTimestamp?.(new Error("Late storage failure"));
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(consoleError).not.toHaveBeenCalled();
	});

	test("does not rotate after the hook is disposed", async () => {
		let resolveTimestamp:
			| ((value: Record<string, unknown>) => void)
			| undefined;
		const browser = installWallpaperBrowser({
			settings: createSettings({
				images: ["first", "second"],
				randomizeWallpaper: "hourly",
				selectedImageId: "first",
			}),
		});
		browser.localGet.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveTimestamp = resolve;
				}),
		);
		const { unmount } = renderHook(() => useWallpaper(), { wrapper: Wrapper });
		await waitFor(() => expect(resolveTimestamp).toBeDefined());

		unmount();
		resolveTimestamp?.({ [LAST_WALLPAPER_CHANGED_AT]: "0" });
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(browser.localSet).not.toHaveBeenCalled();
	});
});
