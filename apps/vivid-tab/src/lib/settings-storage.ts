import * as z from "zod/mini";
import { DEFAULT_SETTINGS } from "@/constants/settings";
import { deepMerge } from "@/lib/deep-merge";
import { type Settings, SettingsSchema } from "@/zod/settings";

/**
 * Canonical sync-storage key containing the serialized, versioned settings.
 */
export const SETTINGS_STORAGE_KEY = "settings";

/**
 * Storage key that preserves pre-versioned settings until migration is added.
 *
 * @deprecated Remove in v1.5.0 after v1.4.0 settings migration is complete.
 */
export const LEGACY_SETTINGS_STORAGE_KEY = "settingsLegacyUnversioned";

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
 * Detects the unversioned settings shape used before v1.4.0.
 *
 * @deprecated Remove in v1.5.0 after the migration window closes.
 */
const isLegacyUnversionedSettings = (value: unknown) =>
	value !== null &&
	typeof value === "object" &&
	!Object.hasOwn(value, "version");

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
 * Adds fields introduced by newer releases and validates the complete result.
 * Invalid settings are replaced as a whole with a fresh defaults object.
 *
 * @param persisted - Parsed, potentially partial value from browser storage.
 * @returns Valid settings and metadata describing whether input was reset.
 */
export const normalizeSettings = (persisted: unknown): NormalizedSettings => {
	/*
	 * TODO(settings-v1): migrate the legacy unversioned flat object into the
	 * grouped v1 shape before normalization. Until that migration is implemented,
	 * use defaults while the storage boundary preserves the raw legacy backup.
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
 * Pre-versioned values are backed up before defaults replace them.
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
	let legacyBackup: string | undefined;

	if (isLegacyUnversionedSettings(persisted)) {
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
			typeof storedValue !== "string" || storedValue !== serialized,
	};
};
