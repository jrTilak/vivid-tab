import * as z from "zod/mini";
import { DEFAULT_SETTINGS } from "@/constants/settings";
import { deepMerge } from "@/lib/deep-merge";
import { type Settings, SettingsSchema } from "@/zod/settings";

export const SETTINGS_STORAGE_KEY = "settings";
/** Preserves the source data until the TODO legacy migration is implemented. */
export const LEGACY_SETTINGS_STORAGE_KEY = "settingsLegacyUnversioned";

const defaultSettingsResult = z.safeParse(SettingsSchema, DEFAULT_SETTINGS);

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

export interface NormalizedSettings {
	settings: Settings;
	wasReset: boolean;
	error?: unknown;
}

export interface ResolvedStoredSettings extends NormalizedSettings {
	legacyBackup?: string;
	serialized: string;
	shouldPersist: boolean;
}

const isLegacyUnversionedSettings = (value: unknown) =>
	value !== null &&
	typeof value === "object" &&
	!Object.hasOwn(value, "version");

/** Returns a new settings object with no references shared with the defaults. */
export const createDefaultSettings = (): Settings =>
	deepMerge(VALIDATED_DEFAULT_SETTINGS, undefined) as Settings;

/** Serializes settings in the canonical schema property order. */
export const serializeSettings = (settings: Settings): string =>
	JSON.stringify(settings);

/**
 * Adds fields introduced by newer releases and validates the complete result.
 * Invalid settings are replaced as a whole with a fresh defaults object.
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
