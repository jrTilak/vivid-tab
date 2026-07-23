import * as z from "zod/mini";
import { DEFAULT_SETTINGS, SETTINGS_VERSION } from "@/constants/settings";
import { deepMerge } from "@/lib/deep-merge";
import { type Settings, SettingsSchema } from "@/zod/settings";

/**
 * Canonical sync-storage key containing the serialized, versioned settings.
 */
export const SETTINGS_STORAGE_KEY = "settings";

/**
 * Storage key preserving the raw v1.3 value throughout the migration window.
 *
 * @deprecated Remove in v1.5.0 after v1.4.0 settings migration is complete.
 */
export const LEGACY_SETTINGS_STORAGE_KEY = "settingsLegacyUnversioned";

/**
 * Prevents the backup fallback from replaying after migration has succeeded.
 *
 * @deprecated Remove in v1.5.0 with the other v1.3 migration state.
 */
const V13_MIGRATION_COMPLETE_STORAGE_KEY = "settingsV13MigrationComplete";

const defaultSettingsResult = z.safeParse(SettingsSchema, DEFAULT_SETTINGS);

/* istanbul ignore if -- this source invariant cannot be induced through runtime input. */
if (!defaultSettingsResult.success) {
	throw new Error("DEFAULT_SETTINGS does not match SettingsSchema");
}

/*
 * Missing layout slots are intentional: users remove widgets by deleting a slot.
 * Replacing this object atomically prevents a migration from restoring widgets.
 */
const shouldReplaceSetting = (path: readonly string[]) =>
	path.length === 2 && path[0] === "widgets" && path[1] === "layout";

const VALIDATED_DEFAULT_SETTINGS = defaultSettingsResult.data;

/**
 * Result of merging and validating a value against the current settings schema.
 */
export interface NormalizedSettings {
	/** Valid current-version settings, freshly reset when validation failed. */
	settings: Settings;
	/** Indicates that persisted input was discarded in favor of defaults. */
	wasReset: boolean;
	/** Original parse, migration, or validation failure when one occurred. */
	error?: unknown;
}

/**
 * Normalized settings plus the canonical values needed at the storage boundary.
 */
export interface ResolvedStoredSettings extends NormalizedSettings {
	/**
	 * Original pre-versioned JSON retained for the v1.4.0 migration window.
	 *
	 * @deprecated Remove in v1.5.0 with `LEGACY_SETTINGS_STORAGE_KEY`.
	 */
	legacyBackup?: string;
	/** Canonical JSON representation of the normalized settings. */
	serialized: string;
	/** Indicates that storage differs from the canonical serialized value. */
	shouldPersist: boolean;
}

/**
 * Exact application-version boundary that owns the temporary v1.3 migration.
 * Patch releases on either side are accepted, but no other upgrade path is.
 */
const isV13ToV14Upgrade = (previousVersion: string, currentVersion: string) =>
	/^1\.3(?:\.\d+){0,2}$/.test(previousVersion) &&
	/^1\.4(?:\.\d+){0,2}$/.test(currentVersion);

/**
 * Detects the unversioned settings shape used before v1.4.0.
 *
 * @deprecated Remove in v1.5.0 after the migration window closes.
 */
const isLegacyUnversionedSettings = (value: unknown) =>
	value !== null &&
	typeof value === "object" &&
	!Object.hasOwn(value, "version");

/**
 * Converts the flat persisted shape shipped in v1.3 into grouped v1 settings.
 * Retired search fields are deliberately omitted; all newly introduced fields
 * are supplied by the normal defaults merge before schema validation.
 */
const groupLegacyV13Settings = (legacy: Record<string, unknown>) => ({
	version: SETTINGS_VERSION,
	general: legacy.general,
	widgets: {
		timer: legacy.timer,
		temperature: legacy.temperature,
		quotes: legacy.quotes,
		todos: legacy.todos,
		layout: legacy.layout,
		searchbar:
			legacy.searchbar !== null && typeof legacy.searchbar === "object"
				? {
						searchSuggestions: (legacy.searchbar as Record<string, unknown>)
							.searchSuggestions,
					}
				: undefined,
	},
	appearance: {
		wallpapers: legacy.wallpapers,
		background: legacy.background,
	},
});

/**
 * Creates current-version default settings with no mutable references shared
 * with the module-level defaults or any previous result.
 *
 * @returns A fresh, schema-validated settings object.
 */
export const createDefaultSettings = (): Settings =>
	deepMerge(VALIDATED_DEFAULT_SETTINGS, undefined) as Settings;

/**
 * Serializes validated settings using their canonical schema property order.
 *
 * @param settings - Complete current-version settings.
 * @returns JSON suitable for `chrome.storage.sync`.
 */
export const serializeSettings = (settings: Settings): string =>
	JSON.stringify(settings);

/**
 * Migrates v1.3 sync settings during the single v1.3-to-v1.4 update event.
 * A successful write contains the untouched legacy JSON, canonical versioned
 * settings, and a completion marker that makes a repeated event a no-op.
 *
 * This function intentionally rejects every other application-version boundary;
 * callers must pass `runtime.onInstalled`'s previous version and the active
 * manifest version rather than attempting migration during normal hydration.
 *
 * @param previousVersion - Version reported by the browser before the update.
 * @param currentVersion - Version from the currently installed manifest.
 * @returns Whether an unversioned v1.3 value was migrated and persisted.
 *
 * @deprecated Remove in v1.5.0 after the v1.4.0 migration window closes.
 */
export const migrateV13SettingsOnUpgrade = async (
	previousVersion: string | undefined,
	currentVersion: string,
): Promise<boolean> => {
	if (
		previousVersion === undefined ||
		!isV13ToV14Upgrade(previousVersion, currentVersion)
	) {
		return false;
	}

	const stored = await chrome.storage.sync.get([
		SETTINGS_STORAGE_KEY,
		LEGACY_SETTINGS_STORAGE_KEY,
		V13_MIGRATION_COMPLETE_STORAGE_KEY,
	]);

	if (stored[V13_MIGRATION_COMPLETE_STORAGE_KEY] === true) return false;

	let legacyBackup: string | undefined;
	let persistedLegacy: Record<string, unknown> | undefined;

	/*
	 * Prefer the active value. The backup is a race fallback for a provider that
	 * observed the old shape and reset it before this update handler completed.
	 */
	for (const storedValue of [
		stored[SETTINGS_STORAGE_KEY],
		stored[LEGACY_SETTINGS_STORAGE_KEY],
	]) {
		let candidate: unknown = storedValue;

		if (typeof storedValue === "string") {
			try {
				candidate = JSON.parse(storedValue) as unknown;
			} catch {
				continue;
			}
		}

		if (!isLegacyUnversionedSettings(candidate)) continue;

		try {
			legacyBackup =
				typeof storedValue === "string"
					? storedValue
					: JSON.stringify(candidate);
			persistedLegacy = candidate as Record<string, unknown>;
			break;
		} catch {
			/* Never replace a legacy value unless its recovery copy can be retained. */
		}
	}

	if (legacyBackup === undefined || persistedLegacy === undefined) return false;

	const normalized = normalizeSettings(groupLegacyV13Settings(persistedLegacy));
	if (normalized.wasReset) return false;

	await chrome.storage.sync.set({
		[LEGACY_SETTINGS_STORAGE_KEY]: legacyBackup,
		[SETTINGS_STORAGE_KEY]: serializeSettings(normalized.settings),
		[V13_MIGRATION_COMPLETE_STORAGE_KEY]: true,
	});

	return true;
};

/**
 * Adds fields introduced by newer releases and validates the complete result.
 * Invalid settings are replaced as a whole with a fresh defaults object.
 *
 * @param persisted - Parsed, potentially partial value from browser storage.
 * @returns Valid settings and metadata describing whether input was reset.
 */
export const normalizeSettings = (persisted: unknown): NormalizedSettings => {
	/*
	 * Migration is deliberately restricted to runtime.onInstalled's v1.3-to-v1.4
	 * update event. An unversioned value encountered during ordinary hydration is
	 * therefore corruption or an unsupported manual import and must not migrate.
	 */
	if (persisted !== undefined && isLegacyUnversionedSettings(persisted)) {
		return {
			settings: createDefaultSettings(),
			wasReset: true,
			error: new Error("Legacy unversioned settings require migration"),
		};
	}

	const merged = deepMerge(VALIDATED_DEFAULT_SETTINGS, persisted, {
		shouldReplace: shouldReplaceSetting,
	});
	const result = z.safeParse(SettingsSchema, merged);

	if (result.success) {
		return { settings: result.data, wasReset: false };
	}

	return {
		settings: createDefaultSettings(),
		wasReset: true,
		error: result.error,
	};
};

/**
 * Decodes the browser storage value and runs the shared migration boundary.
 * Object values are accepted for compatibility, but canonical writes use JSON.
 * Pre-versioned values remain untouched here because only the browser's update
 * event may migrate them; this also prevents hydration from winning that race.
 *
 * @param storedValue - Raw string, object, or missing browser-storage value.
 * @returns Normalized settings and the exact canonical persistence decision.
 *
 * @example
 * ```ts
 * const resolved = resolveStoredSettings(rawStorage.settings);
 * if (resolved.shouldPersist) {
 *   await chrome.storage.sync.set({ settings: resolved.serialized });
 * }
 * ```
 */
export const resolveStoredSettings = (
	storedValue: unknown,
): ResolvedStoredSettings => {
	let persisted: unknown = storedValue;

	if (typeof storedValue === "string") {
		try {
			persisted = JSON.parse(storedValue) as unknown;
		} catch (error) {
			const settings = createDefaultSettings();

			return {
				settings,
				serialized: serializeSettings(settings),
				shouldPersist: true,
				wasReset: true,
				error,
			};
		}
	}

	const normalized = normalizeSettings(persisted);
	const serialized = serializeSettings(normalized.settings);
	const isLegacy = isLegacyUnversionedSettings(persisted);
	let legacyBackup: string | undefined;

	if (isLegacy) {
		try {
			legacyBackup =
				typeof storedValue === "string"
					? storedValue
					: JSON.stringify(persisted);
		} catch {
			/* A browser-storage value should be serializable; reset still stays safe. */
		}
	}

	return {
		...normalized,
		legacyBackup,
		serialized,
		shouldPersist:
			!isLegacy &&
			(typeof storedValue !== "string" || storedValue !== serialized),
	};
};
