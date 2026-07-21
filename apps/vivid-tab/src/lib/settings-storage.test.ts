import { afterEach, describe, expect, mock, test } from "@test/jest";
import { DEFAULT_SETTINGS, SETTINGS_VERSION } from "@/constants/settings";
import {
	createDefaultSettings,
	LEGACY_SETTINGS_STORAGE_KEY,
	migrateV13SettingsOnUpgrade,
	normalizeSettings,
	resolveStoredSettings,
	SETTINGS_STORAGE_KEY,
	serializeSettings,
} from "@/lib/settings-storage";

const originalChrome = globalThis.chrome;

afterEach(() => {
	globalThis.chrome = originalChrome;
});

const installSyncStorage = (initialSettings: unknown) => {
	const values: Record<string, unknown> = {
		[SETTINGS_STORAGE_KEY]: initialSettings,
	};
	const get = mock(async (_keys: string | string[]) => ({ ...values }));
	const set = mock(async (updates: Record<string, unknown>) => {
		Object.assign(values, updates);
	});

	globalThis.chrome = {
		storage: { sync: { get, set } },
	} as unknown as typeof chrome;

	return { get, set, values };
};

describe("settings normalization", () => {
	test("creates fresh grouped v1 defaults", () => {
		const first = createDefaultSettings();
		const second = createDefaultSettings();

		expect(first).toEqual(second);
		expect(first.version).toBe(SETTINGS_VERSION);
		expect(first.widgets.timer).toEqual(DEFAULT_SETTINGS.widgets.timer);
		expect(first.appearance.background).toEqual(
			DEFAULT_SETTINGS.appearance.background,
		);
		expect(first).not.toBe(second);
		expect(first.widgets).not.toBe(second.widgets);
		expect(first.widgets.quotes.categories).not.toBe(
			second.widgets.quotes.categories,
		);
	});

	test("deep-merges new fields and strips retired search preferences", () => {
		const result = normalizeSettings({
			version: SETTINGS_VERSION,
			general: { rootFolder: "custom-folder" },
			widgets: {
				timer: { timeFormat: "24h" },
				searchbar: {
					dialogBackground: "transparent",
					searchSuggestions: true,
					shortcuts: ["chatgpt"],
					submitDefaultAction: "ask-chatgpt",
				},
			},
		});

		expect(result.wasReset).toBe(false);
		expect(result.settings.general.rootFolder).toBe("custom-folder");
		expect(result.settings.general.showHistory).toBe(false);
		expect(result.settings.widgets.timer).toEqual({
			timeFormat: "24h",
			showSeconds: false,
		});
		expect(result.settings.widgets.searchbar).toEqual({
			searchSuggestions: true,
		});
		expect(result.settings.appearance.radius).toBe("none");
		expect(result.settings.appearance.theme).toBe("dark");
		expect(result.settings.appearance.visualEffect).toBe("translucent");
		expect(result.settings.appearance.wallpapers.bookmarkedImageIds).toEqual(
			[],
		);
		expect(result.settings.appearance).toEqual(
			createDefaultSettings().appearance,
		);
	});

	test("rejects unsupported appearance options", () => {
		const radius = normalizeSettings({
			version: SETTINGS_VERSION,
			appearance: { radius: "large" },
		});
		const visualEffect = normalizeSettings({
			version: SETTINGS_VERSION,
			appearance: { visualEffect: "blurred" },
		});
		const legacyLightTheme = normalizeSettings({
			version: SETTINGS_VERSION,
			appearance: { theme: "light" },
		});

		expect(radius.wasReset).toBe(true);
		expect(visualEffect.wasReset).toBe(true);
		expect(legacyLightTheme.wasReset).toBe(true);
	});

	test("keeps widget layout atomic so hidden widgets stay hidden", () => {
		const layout = { 0: "searchbar", 4: "bookmarks" } as const;
		const result = normalizeSettings({
			version: SETTINGS_VERSION,
			widgets: { layout },
		});

		expect(result.wasReset).toBe(false);
		expect(result.settings.widgets.layout).toEqual(layout);
		expect(result.settings.widgets.layout).not.toHaveProperty("1");

		const emptyLayout = normalizeSettings({
			version: SETTINGS_VERSION,
			widgets: { layout: {} },
		});

		expect(emptyLayout.wasReset).toBe(false);
		expect(emptyLayout.settings.widgets.layout).toEqual({});
	});

	test("rejects duplicate widgets, invalid slots, and unsafe visual values", () => {
		const duplicateWidget = normalizeSettings({
			version: SETTINGS_VERSION,
			widgets: { layout: { 1: "weather", 2: "weather" } },
		});
		const invalidPosition = normalizeSettings({
			version: SETTINGS_VERSION,
			widgets: { layout: { 1: "bookmarks" } },
		});
		const extremeBlur = normalizeSettings({
			appearance: { background: { blurIntensity: 10_000 } },
			version: SETTINGS_VERSION,
		});

		expect(duplicateWidget.wasReset).toBe(true);
		expect(invalidPosition.wasReset).toBe(true);
		expect(extremeBlur.wasReset).toBe(true);
	});

	test("accepts numeric boundaries and rejects values immediately outside them", () => {
		const boundaries = normalizeSettings({
			version: SETTINGS_VERSION,
			appearance: {
				background: { blurIntensity: 0, brightness: 10 },
			},
			widgets: {
				todos: {
					expireAfterCompleted: { durationInMinutes: 525_600 },
				},
			},
		});
		const negativeBlur = normalizeSettings({
			version: SETTINGS_VERSION,
			appearance: { background: { blurIntensity: -1 } },
		});
		const excessiveTodoDuration = normalizeSettings({
			version: SETTINGS_VERSION,
			widgets: {
				todos: {
					expireAfterCompleted: { durationInMinutes: 525_601 },
				},
			},
		});

		expect(boundaries.wasReset).toBe(false);
		expect(boundaries.settings.appearance.background.blurIntensity).toBe(0);
		expect(boundaries.settings.appearance.background.brightness).toBe(10);
		expect(
			boundaries.settings.widgets.todos.expireAfterCompleted.durationInMinutes,
		).toBe(525_600);
		expect(negativeBlur.wasReset).toBe(true);
		expect(excessiveTodoDuration.wasReset).toBe(true);
	});

	test("resets the complete settings object after validation failure", () => {
		const result = normalizeSettings({
			version: SETTINGS_VERSION,
			general: { rootFolder: "custom-folder" },
			widgets: { timer: { showSeconds: "yes" } },
		});

		expect(result.wasReset).toBe(true);
		expect(result.settings).toEqual(createDefaultSettings());
		expect(result.settings.general.rootFolder).toBe(
			DEFAULT_SETTINGS.general.rootFolder,
		);
	});

	test("resets malformed JSON and unsupported versions", () => {
		const malformed = resolveStoredSettings("{not-json");
		const legacyVersion = normalizeSettings({ version: 0 });
		const future = normalizeSettings({ version: SETTINGS_VERSION + 1 });

		expect(malformed.wasReset).toBe(true);
		expect(malformed.shouldPersist).toBe(true);
		expect(malformed.settings).toEqual(createDefaultSettings());
		expect(malformed.error).toBeInstanceOf(SyntaxError);
		expect(legacyVersion.wasReset).toBe(true);
		expect(legacyVersion.settings).toEqual(createDefaultSettings());
		expect(legacyVersion.error).toBeDefined();
		expect(future.wasReset).toBe(true);
		expect(future.settings).toEqual(createDefaultSettings());
		expect(future.error).toBeDefined();
	});

	test("resets legacy unversioned settings before deep merge", () => {
		const legacy = {
			timer: { timeFormat: "24h", showSeconds: true },
			general: { rootFolder: "legacy-folder" },
		};
		const result = normalizeSettings(legacy);
		const stored = JSON.stringify(legacy);
		const resolved = resolveStoredSettings(stored);

		expect(result.wasReset).toBe(true);
		expect(result.settings).toEqual(createDefaultSettings());
		expect(resolved.legacyBackup).toBe(stored);
		expect(LEGACY_SETTINGS_STORAGE_KEY).toBe("settingsLegacyUnversioned");
	});

	test("retains a serializable legacy object for the update-event migration", () => {
		const legacy = {
			general: { rootFolder: "legacy-folder" },
			timer: { showSeconds: true },
		};
		const result = resolveStoredSettings(legacy);

		expect(result.wasReset).toBe(true);
		expect(result.shouldPersist).toBe(false);
		expect(result.legacyBackup).toBe(JSON.stringify(legacy));
		expect(result.settings).toEqual(createDefaultSettings());
	});

	test("strips unknown keys and avoids rewriting canonical storage", () => {
		const normalized = normalizeSettings({
			...createDefaultSettings(),
			obsolete: true,
			widgets: {
				...createDefaultSettings().widgets,
				timer: {
					...createDefaultSettings().widgets.timer,
					obsolete: true,
				},
			},
		});

		expect(normalized.wasReset).toBe(false);
		expect(normalized.settings).not.toHaveProperty("obsolete");
		expect(normalized.settings.widgets.timer).not.toHaveProperty("obsolete");

		const stored = serializeSettings(normalized.settings);
		const resolved = resolveStoredSettings(stored);

		expect(resolved.shouldPersist).toBe(false);
	});

	test("persists a canonical value when stored JSON needs cleanup", () => {
		const stored = JSON.stringify({
			version: SETTINGS_VERSION,
			general: { rootFolder: "kept-folder" },
			obsolete: true,
		});
		const resolved = resolveStoredSettings(stored);

		expect(resolved.wasReset).toBe(false);
		expect(resolved.shouldPersist).toBe(true);
		expect(resolved.settings.general.rootFolder).toBe("kept-folder");
		expect(resolved.settings).not.toHaveProperty("obsolete");
		expect(resolved.serialized).not.toBe(stored);
	});

	test("treats missing storage as first run, not corruption", () => {
		const result = resolveStoredSettings(undefined);

		expect(result.wasReset).toBe(false);
		expect(result.shouldPersist).toBe(true);
		expect(result.settings).toEqual(createDefaultSettings());
	});

	test("accepts object storage but rewrites it to canonical JSON", () => {
		const storedObject = {
			version: SETTINGS_VERSION,
			general: { rootFolder: "object-folder" },
		};
		const result = resolveStoredSettings(storedObject);

		expect(result.wasReset).toBe(false);
		expect(result.shouldPersist).toBe(true);
		expect(result.settings.general.rootFolder).toBe("object-folder");
		expect(JSON.parse(result.serialized)).toEqual(result.settings);
	});

	test("leaves a non-serializable legacy object untouched", () => {
		const legacy: Record<string, unknown> = {};
		legacy.self = legacy;

		const result = resolveStoredSettings(legacy);

		expect(result.wasReset).toBe(true);
		expect(result.shouldPersist).toBe(false);
		expect(result.legacyBackup).toBeUndefined();
		expect(result.settings).toEqual(createDefaultSettings());
	});

	test("migrates every compatible v1.3 preference and keeps its raw backup", async () => {
		const legacy = {
			timer: { timeFormat: "24h", showSeconds: true },
			temperature: { unit: "fahrenheit" },
			quotes: { categories: ["inspirational", "technology"] },
			todos: {
				expireAfterCompleted: {
					enabled: false,
					durationInMinutes: 1_440,
				},
			},
			wallpapers: {
				selectedImageId: "manual-1",
				images: ["manual-1", "online-1"],
				onlineImages: { enabled: true, keywords: "anime, comics" },
			},
			layout: { 0: "searchbar", 3: "todos", 4: "bookmarks" },
			general: {
				rootFolder: "legacy-folder",
				showHistory: true,
				showTopSites: true,
				layout: "list",
				openUrlIn: "new-tab",
				bookmarksCanTakeExtraSpaceIfAvailable: false,
			},
			searchbar: {
				dialogBackground: "transparent",
				shortcuts: ["chatgpt"],
				submitDefaultAction: "ask-chatgpt",
				searchSuggestions: true,
			},
			background: {
				blurIntensity: 2,
				brightness: 7,
				randomizeWallpaper: "daily",
			},
		};
		const rawLegacy = JSON.stringify(legacy);
		const storage = installSyncStorage(rawLegacy);

		await expect(migrateV13SettingsOnUpgrade("1.3.0", "1.4.0")).resolves.toBe(
			true,
		);

		expect(storage.set).toHaveBeenCalledTimes(1);
		expect(storage.get).toHaveBeenCalledWith([
			SETTINGS_STORAGE_KEY,
			LEGACY_SETTINGS_STORAGE_KEY,
			"settingsV13MigrationComplete",
		]);
		expect(storage.values[LEGACY_SETTINGS_STORAGE_KEY]).toBe(rawLegacy);
		const migrated = JSON.parse(
			storage.values[SETTINGS_STORAGE_KEY] as string,
		) as ReturnType<typeof createDefaultSettings>;

		expect(migrated.version).toBe(SETTINGS_VERSION);
		expect(migrated.general).toEqual(legacy.general);
		expect(migrated.widgets).toMatchObject({
			timer: legacy.timer,
			temperature: legacy.temperature,
			quotes: legacy.quotes,
			todos: legacy.todos,
			layout: legacy.layout,
			searchbar: { searchSuggestions: true },
		});
		expect(migrated.widgets.searchbar).not.toHaveProperty("shortcuts");
		expect(migrated.appearance).toEqual({
			...createDefaultSettings().appearance,
			wallpapers: {
				...legacy.wallpapers,
				bookmarkedImageIds: [],
			},
			background: legacy.background,
		});
	});

	test("migrates partial object storage with defaults and then becomes a no-op", async () => {
		const legacy = {
			general: { rootFolder: "legacy-folder" },
			timer: { showSeconds: true },
		};
		const storage = installSyncStorage(legacy);

		await expect(
			migrateV13SettingsOnUpgrade("1.3.9.4", "1.4.2.1"),
		).resolves.toBe(true);
		expect(storage.values[LEGACY_SETTINGS_STORAGE_KEY]).toBe(
			JSON.stringify(legacy),
		);

		const migrated = JSON.parse(
			storage.values[SETTINGS_STORAGE_KEY] as string,
		) as ReturnType<typeof createDefaultSettings>;
		expect(migrated.general.rootFolder).toBe("legacy-folder");
		expect(migrated.widgets.timer).toEqual({
			timeFormat: "12h",
			showSeconds: true,
		});
		expect(migrated.appearance).toEqual(createDefaultSettings().appearance);

		await expect(
			migrateV13SettingsOnUpgrade("1.3.9.4", "1.4.2.1"),
		).resolves.toBe(false);
		expect(storage.get).toHaveBeenCalledTimes(2);
		expect(storage.set).toHaveBeenCalledTimes(1);
	});

	test("recovers from the raw backup when ordinary hydration won the update race", async () => {
		const legacy = {
			general: { rootFolder: "race-preserved-folder" },
			temperature: { unit: "fahrenheit" },
		};
		const rawLegacy = JSON.stringify(legacy);
		const storage = installSyncStorage(
			serializeSettings(createDefaultSettings()),
		);
		storage.values[LEGACY_SETTINGS_STORAGE_KEY] = rawLegacy;

		await expect(migrateV13SettingsOnUpgrade("1.3.0", "1.4.0")).resolves.toBe(
			true,
		);

		const migrated = JSON.parse(
			storage.values[SETTINGS_STORAGE_KEY] as string,
		) as ReturnType<typeof createDefaultSettings>;
		expect(migrated.general.rootFolder).toBe("race-preserved-folder");
		expect(migrated.widgets.temperature.unit).toBe("fahrenheit");
		expect(storage.values[LEGACY_SETTINGS_STORAGE_KEY]).toBe(rawLegacy);

		await expect(migrateV13SettingsOnUpgrade("1.3.0", "1.4.0")).resolves.toBe(
			false,
		);
		expect(storage.set).toHaveBeenCalledTimes(1);
	});

	test("leaves malformed legacy preferences untouched for manual recovery", async () => {
		const rawLegacy = JSON.stringify({
			general: { rootFolder: "preserve-this-backup" },
			timer: { showSeconds: "yes" },
		});
		const storage = installSyncStorage(rawLegacy);

		await expect(migrateV13SettingsOnUpgrade("1.3.0", "1.4.0")).resolves.toBe(
			false,
		);
		expect(storage.set).not.toHaveBeenCalled();
		expect(storage.values[SETTINGS_STORAGE_KEY]).toBe(rawLegacy);
	});

	test.each([
		[undefined, "1.4.0"],
		["1.2.9", "1.4.0"],
		["1.3.0", "1.3.1"],
		["1.3.0", "1.5.0"],
		["1.4.0", "1.4.1"],
		["11.3.0", "1.4.0"],
		["1.30.0", "1.4.0"],
	])("does not inspect storage outside the v1.3-to-v1.4 boundary (%s -> %s)", async (previousVersion, currentVersion) => {
		const storage = installSyncStorage({ timer: { showSeconds: true } });

		await expect(
			migrateV13SettingsOnUpgrade(previousVersion, currentVersion),
		).resolves.toBe(false);
		expect(storage.get).not.toHaveBeenCalled();
		expect(storage.set).not.toHaveBeenCalled();
	});

	test.each([
		["malformed JSON", "{not-json"],
		["missing settings", undefined],
		["already versioned settings", serializeSettings(createDefaultSettings())],
	])("does not rewrite %s during migration", async (_label, storedValue) => {
		const storage = installSyncStorage(storedValue);

		await expect(migrateV13SettingsOnUpgrade("1.3.0", "1.4.0")).resolves.toBe(
			false,
		);
		expect(storage.set).not.toHaveBeenCalled();
	});

	test("keeps an unserializable legacy object untouched", async () => {
		const legacy: Record<string, unknown> = {};
		legacy.self = legacy;
		const storage = installSyncStorage(legacy);

		await expect(migrateV13SettingsOnUpgrade("1.3.0", "1.4.0")).resolves.toBe(
			false,
		);
		expect(storage.set).not.toHaveBeenCalled();
	});
});
