import {
	afterEach,
	beforeEach,
	describe,
	expect,
	mock,
	spyOn,
	test,
} from "@test/jest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { createElement, type PropsWithChildren } from "react";
import {
	LAST_ONLINE_IMAGES_FETCHED_AT,
	LAST_WALLPAPER_CHANGED_AT,
} from "@/constants/keys";
import {
	createDefaultSettings,
	LEGACY_SETTINGS_STORAGE_KEY,
	SETTINGS_STORAGE_KEY,
	serializeSettings,
} from "@/lib/settings-storage";
import { SettingsProvider, useSettings } from "./settings-provider";

const originalChrome = globalThis.chrome;
let storedSettings: unknown;
const storageListeners = new Set<
	(
		changes: Record<string, chrome.storage.StorageChange>,
		areaName: string,
	) => void
>();
const syncGet = mock(async () => ({
	[SETTINGS_STORAGE_KEY]: storedSettings,
}));
const syncSet = mock(async (_values: Record<string, unknown>) => undefined);
const syncRemove = mock(async (_keys: string | string[]) => undefined);
const localRemove = mock(async (_keys: string | string[]) => undefined);
const sendMessage = mock(
	(
		_message: unknown,
		callback: (response: { folderId: string; ok: true }) => void,
	) => callback({ folderId: "resolved-root", ok: true }),
);

const createWrapper = (ensureRootFolder = false) =>
	function SettingsWrapper({ children }: PropsWithChildren) {
		return createElement(SettingsProvider, { children, ensureRootFolder });
	};

const renderSettingsHook = async (ensureRootFolder = false) => {
	const rendered = renderHook(() => useSettings(), {
		wrapper: createWrapper(ensureRootFolder),
	});
	await waitFor(() => expect(rendered.result.current).not.toBeNull());

	return rendered;
};

beforeEach(() => {
	storedSettings = serializeSettings(createDefaultSettings());
	storageListeners.clear();
	syncGet.mockReset();
	syncGet.mockResolvedValue({ [SETTINGS_STORAGE_KEY]: storedSettings });
	syncSet.mockReset();
	syncSet.mockResolvedValue(undefined);
	syncRemove.mockReset();
	syncRemove.mockResolvedValue(undefined);
	localRemove.mockReset();
	localRemove.mockResolvedValue(undefined);
	sendMessage.mockReset();
	sendMessage.mockImplementation((_message, callback) =>
		callback({ folderId: "resolved-root", ok: true }),
	);
	globalThis.chrome = {
		runtime: {
			lastError: undefined,
			sendMessage,
		},
		storage: {
			local: { remove: localRemove },
			onChanged: {
				addListener: (listener) => storageListeners.add(listener),
				removeListener: (listener) => storageListeners.delete(listener),
			},
			sync: {
				get: syncGet,
				remove: syncRemove,
				set: syncSet,
			},
		},
	} as unknown as typeof chrome;
});

afterEach(() => {
	cleanup();
	globalThis.chrome = originalChrome;
});

describe("SettingsProvider and useSettings", () => {
	test("requires the hook to be used inside its provider", () => {
		expect(() => renderHook(() => useSettings())).toThrow(
			"useSettings must be used within a SettingsProvider",
		);
	});

	test("hydrates canonical settings without rewriting them", async () => {
		const { result, unmount } = await renderSettingsHook();

		expect(result.current.settings).toEqual(createDefaultSettings());
		expect(syncGet).toHaveBeenCalledWith(SETTINGS_STORAGE_KEY);
		expect(syncSet).not.toHaveBeenCalled();
		expect(storageListeners.size).toBe(1);
		unmount();
		expect(storageListeners.size).toBe(0);
	});

	test("persists defaults on first run", async () => {
		storedSettings = undefined;
		syncGet.mockResolvedValue({ [SETTINGS_STORAGE_KEY]: storedSettings });
		const { result } = await renderSettingsHook();

		expect(result.current.settings).toEqual(createDefaultSettings());
		await waitFor(() => expect(syncSet).toHaveBeenCalledTimes(1));
		expect(syncSet).toHaveBeenCalledWith({
			[SETTINGS_STORAGE_KEY]: serializeSettings(createDefaultSettings()),
		});
	});

	test("recovers corrupt initial storage and persists canonical defaults", async () => {
		const consoleError = spyOn(console, "error").mockImplementation(() => {});
		storedSettings = "{not-json";
		syncGet.mockResolvedValue({ [SETTINGS_STORAGE_KEY]: storedSettings });

		const { result } = await renderSettingsHook();

		expect(result.current.settings).toEqual(createDefaultSettings());
		await waitFor(() => expect(syncSet).toHaveBeenCalledTimes(1));
		expect(consoleError).toHaveBeenCalledWith(
			"Invalid settings from initial load; reset to defaults.",
			expect.any(Object),
		);
		consoleError.mockRestore();
	});

	test("leaves unversioned storage untouched for the update-event migration", async () => {
		const consoleError = spyOn(console, "error").mockImplementation(() => {});
		storedSettings = JSON.stringify({
			general: { rootFolder: "legacy-folder" },
			timer: { showSeconds: true },
		});
		syncGet.mockResolvedValue({ [SETTINGS_STORAGE_KEY]: storedSettings });

		const { result } = await renderSettingsHook();

		expect(result.current.settings).toEqual(createDefaultSettings());
		expect(syncSet).not.toHaveBeenCalled();
		expect(consoleError).toHaveBeenCalledWith(
			"Invalid settings from initial load; reset to defaults.",
			expect.any(Object),
		);
		consoleError.mockRestore();
	});

	test("does not let legacy root resolution overwrite a concurrent migration", async () => {
		const consoleError = spyOn(console, "error").mockImplementation(() => {});
		const legacySettings = JSON.stringify({
			general: { rootFolder: "legacy-folder", showTopSites: false },
			timer: { showSeconds: true },
		});
		storedSettings = legacySettings;
		syncGet.mockResolvedValue({ [SETTINGS_STORAGE_KEY]: storedSettings });
		const rootCallbacks: Array<
			(response: { folderId: string; ok: true }) => void
		> = [];
		sendMessage.mockImplementation((_message, callback) => {
			rootCallbacks.push(callback);
		});
		const rendered = renderHook(() => useSettings(), {
			wrapper: createWrapper(true),
		});
		await waitFor(() => expect(rootCallbacks).toHaveLength(1));

		const migrated = createDefaultSettings();
		migrated.general.rootFolder = "migrated-root";
		migrated.general.showTopSites = true;
		const serializedMigration = serializeSettings(migrated);
		const backgroundWrite = {
			[LEGACY_SETTINGS_STORAGE_KEY]: legacySettings,
			[SETTINGS_STORAGE_KEY]: serializedMigration,
			settingsV13MigrationComplete: true,
		};

		/* The storage write can complete before Chrome delivers its change event. */
		await syncSet(backgroundWrite);
		act(() =>
			rootCallbacks[0]?.({ folderId: "legacy-resolved-root", ok: true }),
		);
		await waitFor(() => expect(rendered.result.current).not.toBeNull());
		expect(syncSet).toHaveBeenCalledTimes(1);
		expect(syncSet).toHaveBeenLastCalledWith(backgroundWrite);

		act(() => {
			for (const listener of storageListeners) {
				listener(
					{
						[SETTINGS_STORAGE_KEY]: {
							newValue: serializedMigration,
							oldValue: legacySettings,
						},
					},
					"sync",
				);
			}
		});
		await waitFor(() => expect(rootCallbacks).toHaveLength(2));
		act(() => rootCallbacks[1]?.({ folderId: "migrated-root", ok: true }));

		await waitFor(() =>
			expect(rendered.result.current.settings.general.showTopSites).toBe(true),
		);
		expect(rendered.result.current.settings.general.rootFolder).toBe(
			"migrated-root",
		);
		expect(syncSet).toHaveBeenCalledTimes(1);
		consoleError.mockRestore();
	});

	test("reports a failed canonical write during initial recovery", async () => {
		const consoleError = spyOn(console, "error").mockImplementation(() => {});
		storedSettings = undefined;
		syncGet.mockResolvedValue({ [SETTINGS_STORAGE_KEY]: storedSettings });
		syncSet.mockRejectedValueOnce(new Error("sync unavailable"));

		await renderSettingsHook();

		await waitFor(() =>
			expect(consoleError).toHaveBeenCalledWith(
				"Failed to persist normalized settings:",
				expect.any(Error),
			),
		);
		consoleError.mockRestore();
	});

	test("debounces state updates before writing sync storage", async () => {
		const { result } = await renderSettingsHook();
		syncSet.mockClear();

		act(() => {
			result.current.setSettings((current) => ({
				...current,
				general: { ...current.general, showHistory: true },
			}));
		});
		expect(syncSet).not.toHaveBeenCalled();

		await waitFor(() => expect(syncSet).toHaveBeenCalledTimes(1), {
			timeout: 1_000,
		});
		const persisted = syncSet.mock.calls[0]?.[0]?.[SETTINGS_STORAGE_KEY];
		expect(JSON.parse(String(persisted)).general.showHistory).toBe(true);
	});

	test("saveSettings writes immediately and resets invalid candidates", async () => {
		const consoleError = spyOn(console, "error").mockImplementation(() => {});
		const { result } = await renderSettingsHook();
		syncSet.mockClear();
		let wasValid = true;

		await act(async () => {
			wasValid = await result.current.saveSettings({
				...createDefaultSettings(),
				appearance: {
					...createDefaultSettings().appearance,
					radius: "invalid",
				},
			});
		});

		expect(wasValid).toBe(false);
		expect(result.current.settings).toEqual(createDefaultSettings());
		expect(syncSet).toHaveBeenCalledWith({
			[SETTINGS_STORAGE_KEY]: serializeSettings(createDefaultSettings()),
		});
		consoleError.mockRestore();
	});

	test("retries a debounced value after a transient storage write failure", async () => {
		const consoleError = spyOn(console, "error").mockImplementation(() => {});
		const { result } = await renderSettingsHook();
		syncSet.mockReset();
		syncSet
			.mockRejectedValueOnce(new Error("sync unavailable"))
			.mockResolvedValue(undefined);

		act(() => {
			result.current.setSettings((current) => ({
				...current,
				general: { ...current.general, showHistory: true },
			}));
		});
		await waitFor(() => expect(syncSet).toHaveBeenCalledTimes(1), {
			timeout: 1_000,
		});
		await waitFor(() =>
			expect(consoleError).toHaveBeenCalledWith(
				"Failed to save settings:",
				expect.any(Error),
			),
		);

		act(() => {
			result.current.setSettings((current) => ({ ...current }));
		});
		await waitFor(() => expect(syncSet).toHaveBeenCalledTimes(2), {
			timeout: 1_000,
		});
		expect(syncSet.mock.calls[1]?.[0]).toEqual(syncSet.mock.calls[0]?.[0]);
		consoleError.mockRestore();
	});

	test("keeps defaults read-only after initial storage access fails", async () => {
		const consoleError = spyOn(console, "error").mockImplementation(() => {});
		syncGet.mockRejectedValueOnce(new Error("storage denied"));

		const { result } = await renderSettingsHook();

		expect(result.current.settings).toEqual(createDefaultSettings());
		await expect(
			result.current.saveSettings(createDefaultSettings()),
		).rejects.toThrow("Settings storage is unavailable");
		act(() => {
			result.current.setSettings((current) => ({
				...current,
				general: { ...current.general, showHistory: true },
			}));
		});
		await new Promise((resolve) => setTimeout(resolve, 450));
		expect(syncSet).not.toHaveBeenCalled();
		expect(consoleError).toHaveBeenCalledWith(
			"Failed to load settings; using defaults:",
			expect.any(Error),
		);
		consoleError.mockRestore();
	});

	test("resolves and persists a missing bookmark root when requested", async () => {
		const { result } = await renderSettingsHook(true);

		expect(sendMessage).toHaveBeenCalledTimes(1);
		expect(result.current.settings.general.rootFolder).toBe("resolved-root");
		await waitFor(() => expect(syncSet).toHaveBeenCalledTimes(1));
		const persisted = syncSet.mock.calls[0]?.[0]?.[SETTINGS_STORAGE_KEY];
		expect(JSON.parse(String(persisted)).general.rootFolder).toBe(
			"resolved-root",
		);
	});

	test("preserves valid settings when bookmark-root resolution fails", async () => {
		const consoleError = spyOn(console, "error").mockImplementation(() => {});
		sendMessage.mockImplementationOnce((_message, callback) =>
			callback(undefined),
		);

		const { result } = await renderSettingsHook(true);

		expect(result.current.settings).toEqual(createDefaultSettings());
		expect(syncSet).not.toHaveBeenCalled();
		expect(consoleError).toHaveBeenCalledWith(
			"Failed to resolve the root folder from initial load:",
			expect.any(Error),
		);
		consoleError.mockRestore();
	});

	test("adopts valid settings received from another sync context", async () => {
		const { result } = await renderSettingsHook();
		const external = createDefaultSettings();
		external.general.showTopSites = true;
		const serialized = serializeSettings(external);

		await act(async () => {
			for (const listener of storageListeners) {
				listener(
					{
						[SETTINGS_STORAGE_KEY]: {
							newValue: serialized,
							oldValue: storedSettings,
						},
					},
					"sync",
				);
			}
			await Promise.resolve();
		});

		await waitFor(() =>
			expect(result.current.settings.general.showTopSites).toBe(true),
		);
	});

	test("ignores unrelated and locally echoed storage changes", async () => {
		const { result } = await renderSettingsHook();
		const initialSettings = result.current.settings;
		const listener = [...storageListeners][0];
		expect(listener).toBeDefined();

		act(() => {
			listener?.({}, "sync");
			listener?.(
				{ [SETTINGS_STORAGE_KEY]: { newValue: "different" } },
				"local",
			);
			listener?.(
				{ [SETTINGS_STORAGE_KEY]: { newValue: storedSettings } },
				"sync",
			);
		});

		expect(result.current.settings).toBe(initialSettings);
		expect(syncSet).not.toHaveBeenCalled();
	});

	test("lets a newer storage event win over a stale initial read", async () => {
		let resolveInitialRead:
			| ((value: { [SETTINGS_STORAGE_KEY]: unknown }) => void)
			| undefined;
		syncGet.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					resolveInitialRead = resolve;
				}),
		);
		const rendered = renderHook(() => useSettings(), {
			wrapper: createWrapper(),
		});
		await waitFor(() => expect(storageListeners.size).toBe(1));
		const external = createDefaultSettings();
		external.general.showTopSites = true;

		act(() => {
			for (const listener of storageListeners) {
				listener(
					{
						[SETTINGS_STORAGE_KEY]: {
							newValue: serializeSettings(external),
						},
					},
					"sync",
				);
			}
		});
		resolveInitialRead?.({ [SETTINGS_STORAGE_KEY]: storedSettings });

		await waitFor(() => expect(rendered.result.current).not.toBeNull());
		expect(rendered.result.current.settings.general.showTopSites).toBe(true);
	});

	test("lets a newer storage event win when the stale initial read rejects", async () => {
		let rejectInitialRead: ((error: Error) => void) | undefined;
		syncGet.mockImplementationOnce(
			() =>
				new Promise((_resolve, reject) => {
					rejectInitialRead = reject;
				}),
		);
		const rendered = renderHook(() => useSettings(), {
			wrapper: createWrapper(),
		});
		await waitFor(() => expect(storageListeners.size).toBe(1));
		const external = createDefaultSettings();
		external.general.showHistory = true;

		act(() => {
			for (const listener of storageListeners) {
				listener(
					{
						[SETTINGS_STORAGE_KEY]: {
							newValue: serializeSettings(external),
						},
					},
					"sync",
				);
			}
		});
		rejectInitialRead?.(new Error("stale failure"));

		await waitFor(() => expect(rendered.result.current).not.toBeNull());
		expect(rendered.result.current.settings.general.showHistory).toBe(true);
	});

	test("ignores initial root resolution after a newer storage value resolves", async () => {
		const rootCallbacks: Array<
			(response: { folderId: string; ok: true }) => void
		> = [];
		sendMessage.mockImplementation((_message, callback) => {
			rootCallbacks.push(callback);
		});
		const rendered = renderHook(() => useSettings(), {
			wrapper: createWrapper(true),
		});
		await waitFor(() => expect(rootCallbacks).toHaveLength(1));
		const external = createDefaultSettings();
		external.general.showTopSites = true;

		act(() => {
			for (const listener of storageListeners) {
				listener(
					{
						[SETTINGS_STORAGE_KEY]: {
							newValue: serializeSettings(external),
						},
					},
					"sync",
				);
			}
		});
		await waitFor(() => expect(rootCallbacks).toHaveLength(2));
		act(() => rootCallbacks[1]?.({ folderId: "event-root", ok: true }));
		await Promise.resolve();
		act(() => rootCallbacks[0]?.({ folderId: "stale-root", ok: true }));

		await waitFor(() => expect(rendered.result.current).not.toBeNull());
		expect(rendered.result.current.settings.general.showTopSites).toBe(true);
		expect(rendered.result.current.settings.general.rootFolder).toBe(
			"event-root",
		);
	});

	test("normalizes invalid debounced state before persisting it", async () => {
		const consoleError = spyOn(console, "error").mockImplementation(() => {});
		const { result } = await renderSettingsHook();
		syncSet.mockClear();

		act(() => {
			result.current.setSettings({
				...createDefaultSettings(),
				appearance: {
					...createDefaultSettings().appearance,
					radius: "invalid",
				},
			} as unknown as ReturnType<typeof createDefaultSettings>);
		});

		await waitFor(
			() => expect(result.current.settings).toEqual(createDefaultSettings()),
			{
				timeout: 1_000,
			},
		);
		expect(syncSet).not.toHaveBeenCalled();
		expect(consoleError).toHaveBeenCalledWith(
			"Invalid settings update; reset to defaults.",
			expect.any(Object),
		);
		consoleError.mockRestore();
	});

	test("reset removes only settings and wallpaper metadata before saving defaults", async () => {
		const custom = createDefaultSettings();
		custom.general.showHistory = true;
		storedSettings = serializeSettings(custom);
		const { result } = await renderSettingsHook();
		syncSet.mockClear();

		await act(async () => {
			await result.current.resetSettings();
		});

		expect(syncRemove).toHaveBeenCalledWith([
			SETTINGS_STORAGE_KEY,
			LEGACY_SETTINGS_STORAGE_KEY,
		]);
		expect(localRemove).toHaveBeenCalledWith([
			LAST_ONLINE_IMAGES_FETCHED_AT,
			LAST_WALLPAPER_CHANGED_AT,
		]);
		expect(result.current.settings).toEqual(createDefaultSettings());
		expect(syncSet).toHaveBeenCalledWith({
			[SETTINGS_STORAGE_KEY]: serializeSettings(createDefaultSettings()),
		});
	});

	test("re-enables storage events after reset removal fails", async () => {
		syncRemove.mockRejectedValueOnce(new Error("remove failed"));
		const { result } = await renderSettingsHook();

		await expect(result.current.resetSettings()).rejects.toThrow(
			"remove failed",
		);
		const external = createDefaultSettings();
		external.general.showHistory = true;
		act(() => {
			for (const listener of storageListeners) {
				listener(
					{
						[SETTINGS_STORAGE_KEY]: {
							newValue: serializeSettings(external),
						},
					},
					"sync",
				);
			}
		});

		await waitFor(() =>
			expect(result.current.settings.general.showHistory).toBe(true),
		);
	});

	test("continues reset when wallpaper database deletion fails", async () => {
		const consoleError = spyOn(console, "error").mockImplementation(() => {});
		const deleteDatabase = spyOn(
			indexedDB,
			"deleteDatabase",
		).mockImplementation(() => {
			throw new Error("database blocked");
		});
		const { result } = await renderSettingsHook();
		syncSet.mockClear();

		await act(async () => {
			await result.current.resetSettings();
		});

		expect(syncSet).toHaveBeenCalledTimes(1);
		expect(consoleError).toHaveBeenCalledWith(
			"Failed to clear stored wallpapers:",
			expect.any(Error),
		);
		deleteDatabase.mockRestore();
		consoleError.mockRestore();
	});
});
