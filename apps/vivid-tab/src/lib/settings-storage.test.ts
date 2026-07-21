import { describe, expect, test } from "@test/jest";
import { DEFAULT_SETTINGS, SETTINGS_VERSION } from "@/constants/settings";
import {
	createDefaultSettings,
	LEGACY_SETTINGS_STORAGE_KEY,
	normalizeSettings,
	resolveStoredSettings,
	serializeSettings,
} from "@/lib/settings-storage";

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
		expect(first.widgets.searchbar.shortcuts).not.toBe(
			second.widgets.searchbar.shortcuts,
		);
	});

	test("deep-merges new fields into a partial current-version object", () => {
		const result = normalizeSettings({
			version: SETTINGS_VERSION,
			general: { rootFolder: "custom-folder" },
			widgets: {
				timer: { timeFormat: "24h" },
				searchbar: { shortcuts: [] },
			},
		});

		expect(result.wasReset).toBe(false);
		expect(result.settings.general.rootFolder).toBe("custom-folder");
		expect(result.settings.general.showHistory).toBe(false);
		expect(result.settings.widgets.timer).toEqual({
			timeFormat: "24h",
			showSeconds: false,
		});
		expect(result.settings.widgets.searchbar.shortcuts).toEqual([]);
		expect(result.settings.appearance.radius).toBe("rounded");
		expect(result.settings.appearance.visualEffect).toBe("translucent");
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

		expect(radius.wasReset).toBe(true);
		expect(visualEffect.wasReset).toBe(true);
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

	test("backs up a serializable legacy object before resetting it", () => {
		const legacy = {
			general: { rootFolder: "legacy-folder" },
			timer: { showSeconds: true },
		};
		const result = resolveStoredSettings(legacy);

		expect(result.wasReset).toBe(true);
		expect(result.shouldPersist).toBe(true);
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

	test("still resets a non-serializable legacy object safely", () => {
		const legacy: Record<string, unknown> = {};
		legacy.self = legacy;

		const result = resolveStoredSettings(legacy);

		expect(result.wasReset).toBe(true);
		expect(result.shouldPersist).toBe(true);
		expect(result.legacyBackup).toBeUndefined();
		expect(result.settings).toEqual(createDefaultSettings());
	});

	test.todo("migrates legacy unversioned settings into grouped v1 settings");
});
