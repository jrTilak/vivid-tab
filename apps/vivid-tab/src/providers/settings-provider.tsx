import React, {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	LAST_ONLINE_IMAGES_FETCHED_AT,
	LAST_WALLPAPER_CHANGED_AT,
} from "@/constants/keys";
import { ensureRootBookmarkFolder } from "@/lib/bookmarks";
import {
	createDefaultSettings,
	LEGACY_SETTINGS_STORAGE_KEY,
	normalizeSettings,
	type ResolvedStoredSettings,
	resolveStoredSettings,
	SETTINGS_STORAGE_KEY,
	serializeSettings,
} from "@/lib/settings-storage";
import { deleteWallpaperDatabase } from "@/lib/wallpapers/database";
import type { Settings } from "@/zod/settings";

const SYNC_DEBOUNCE_MS = 400;

interface SettingsContextState {
	settings: Settings;
	setSettings: React.Dispatch<React.SetStateAction<Settings>>;
	resetSettings: () => Promise<void>;
	/** Validates and immediately persists settings, returning false after a reset. */
	saveSettings: (candidate: unknown) => Promise<boolean>;
}

const SettingsContext = createContext<SettingsContextState | undefined>(
	undefined,
);

const SettingsProvider: React.FC<{
	children: ReactNode;
	ensureRootFolder?: boolean;
}> = ({ children, ensureRootFolder = false }) => {
	const [isLoaded, setIsLoaded] = useState(false);
	const [settings, setSettings] = useState<Settings>(createDefaultSettings);
	const lastPersistedSettingsRef = useRef<string | null>(null);
	const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const ignoreStorageChangesRef = useRef(false);
	const persistenceEnabledRef = useRef(false);
	const storageRevisionRef = useRef(0);

	const replaceSettings = useCallback((next: Settings) => {
		setSettings((previous) =>
			serializeSettings(previous) === serializeSettings(next) ? previous : next,
		);
	}, []);

	const writeSerializedSettings = useCallback(
		async (serialized: string, legacyBackup?: string) => {
			lastPersistedSettingsRef.current = serialized;

			try {
				await chrome.storage.sync.set({
					[SETTINGS_STORAGE_KEY]: serialized,
					...(legacyBackup === undefined
						? {}
						: { [LEGACY_SETTINGS_STORAGE_KEY]: legacyBackup }),
				});
			} catch (error) {
				/*
				 * Allow a later change to retry if this write failed. Keeping the failed
				 * value here would make the debounce believe it was already persisted.
				 */
				if (lastPersistedSettingsRef.current === serialized) {
					lastPersistedSettingsRef.current = null;
				}

				throw error;
			}
		},
		[],
	);

	const applyResolvedSettings = useCallback(
		(resolved: ResolvedStoredSettings, source: string) => {
			persistenceEnabledRef.current = true;

			if (syncTimeoutRef.current) {
				clearTimeout(syncTimeoutRef.current);
				syncTimeoutRef.current = null;
			}

			if (resolved.wasReset) {
				console.error(`Invalid settings from ${source}; reset to defaults.`, {
					cause: resolved.error,
				});
			}

			replaceSettings(resolved.settings);
			lastPersistedSettingsRef.current = resolved.serialized;

			/*
			 * Persist only migrations, first-run defaults, or corruption recovery.
			 * Canonical values do not cause a write on every provider mount.
			 */
			if (resolved.shouldPersist) {
				void writeSerializedSettings(
					resolved.serialized,
					resolved.legacyBackup,
				).catch((error) => {
					console.error("Failed to persist normalized settings:", error);
				});
			}
		},
		[replaceSettings, writeSerializedSettings],
	);

	const withResolvedRootFolder = useCallback(
		async (candidate: Settings): Promise<Settings> => {
			if (!ensureRootFolder) return candidate;

			const rootFolder = await ensureRootBookmarkFolder(
				candidate.general.rootFolder,
			);

			if (rootFolder === candidate.general.rootFolder) return candidate;

			return {
				...candidate,
				general: {
					...candidate.general,
					rootFolder,
				},
			};
		},
		[ensureRootFolder],
	);

	const resolveSettingsRootFolder = useCallback(
		async (
			resolved: ResolvedStoredSettings,
			source: string,
		): Promise<ResolvedStoredSettings> => {
			try {
				const settings = await withResolvedRootFolder(resolved.settings);
				if (settings === resolved.settings) return resolved;

				return {
					...resolved,
					settings,
					serialized: serializeSettings(settings),
					shouldPersist: true,
				};
			} catch (error) {
				/* A transient bookmarks failure must not discard otherwise valid settings. */
				console.error(
					`Failed to resolve the root folder from ${source}:`,
					error,
				);

				return resolved;
			}
		},
		[withResolvedRootFolder],
	);

	const saveSettings = useCallback(
		async (candidate: unknown) => {
			if (!persistenceEnabledRef.current) {
				throw new Error("Settings storage is unavailable");
			}

			if (syncTimeoutRef.current) {
				clearTimeout(syncTimeoutRef.current);
				syncTimeoutRef.current = null;
			}

			const normalized = normalizeSettings(candidate);
			const nextSettings = await withResolvedRootFolder(normalized.settings);

			if (normalized.wasReset) {
				console.error("Invalid settings; reset to defaults.", {
					cause: normalized.error,
				});
			}

			replaceSettings(nextSettings);
			await writeSerializedSettings(serializeSettings(nextSettings));

			return !normalized.wasReset;
		},
		[replaceSettings, withResolvedRootFolder, writeSerializedSettings],
	);

	const resetSettings = useCallback(async () => {
		ignoreStorageChangesRef.current = true;

		try {
			await Promise.all([
				chrome.storage.sync.remove([
					SETTINGS_STORAGE_KEY,
					LEGACY_SETTINGS_STORAGE_KEY,
				]),
				chrome.storage.local.remove([
					LAST_ONLINE_IMAGES_FETCHED_AT,
					LAST_WALLPAPER_CHANGED_AT,
				]),
			]);
		} finally {
			ignoreStorageChangesRef.current = false;
		}

		persistenceEnabledRef.current = true;

		/*
		 * This is the explicit factory-reset action. Corrupt settings use
		 * saveSettings instead, so they never erase local data or wallpaper files.
		 */
		try {
			await deleteWallpaperDatabase();
		} catch (error) {
			console.error("Failed to clear stored wallpapers:", error);
		}
		await saveSettings(createDefaultSettings());
	}, [saveSettings]);

	useEffect(() => {
		let disposed = false;

		const handleStorageChange = (
			changes: { [key: string]: chrome.storage.StorageChange },
			areaName: string,
		) => {
			if (
				areaName !== "sync" ||
				ignoreStorageChangesRef.current ||
				!changes[SETTINGS_STORAGE_KEY]
			) {
				return;
			}

			const storedValue = changes[SETTINGS_STORAGE_KEY].newValue;
			const storageRevision = ++storageRevisionRef.current;

			if (
				typeof storedValue === "string" &&
				storedValue === lastPersistedSettingsRef.current
			) {
				return;
			}

			void resolveSettingsRootFolder(
				resolveStoredSettings(storedValue),
				"storage change",
			).then((resolved) => {
				if (disposed || storageRevisionRef.current !== storageRevision) return;

				applyResolvedSettings(resolved, "storage change");
			});
		};

		chrome.storage.onChanged.addListener(handleStorageChange);
		const hydrationRevision = storageRevisionRef.current;

		void chrome.storage.sync
			.get(SETTINGS_STORAGE_KEY)
			.then(async (result) => {
				if (disposed) return;

				/*
				 * A storage event may deliver a newer value while the initial read is
				 * pending. In that case the event already won and this snapshot is stale.
				 */
				if (storageRevisionRef.current !== hydrationRevision) {
					setIsLoaded(true);
					return;
				}

				const resolved = await resolveSettingsRootFolder(
					resolveStoredSettings(result[SETTINGS_STORAGE_KEY]),
					"initial load",
				);

				if (disposed) return;

				if (storageRevisionRef.current !== hydrationRevision) {
					setIsLoaded(true);
					return;
				}

				applyResolvedSettings(resolved, "initial load");

				setIsLoaded(true);
			})
			.catch((error) => {
				if (disposed) return;
				if (storageRevisionRef.current !== hydrationRevision) {
					setIsLoaded(true);

					return;
				}

				console.error("Failed to load settings; using defaults:", error);
				/* Keep this fallback read-only so a transient read error cannot erase sync. */
				persistenceEnabledRef.current = false;
				replaceSettings(createDefaultSettings());
				setIsLoaded(true);
			});

		return () => {
			disposed = true;
			chrome.storage.onChanged.removeListener(handleStorageChange);
		};
	}, [applyResolvedSettings, replaceSettings, resolveSettingsRootFolder]);

	useEffect(() => {
		if (!isLoaded || !persistenceEnabledRef.current) return;

		if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

		const snapshot = settings;

		syncTimeoutRef.current = setTimeout(() => {
			syncTimeoutRef.current = null;

			/*
			 * Validation happens once at the debounced storage boundary, not during
			 * rendering or every small UI update.
			 */
			const normalized = normalizeSettings(snapshot);
			const serialized = serializeSettings(normalized.settings);

			if (normalized.wasReset) {
				console.error("Invalid settings update; reset to defaults.", {
					cause: normalized.error,
				});
			}

			if (normalized.wasReset || serialized !== serializeSettings(snapshot)) {
				replaceSettings(normalized.settings);
			}

			if (serialized === lastPersistedSettingsRef.current) return;

			void writeSerializedSettings(serialized).catch((error) => {
				console.error("Failed to save settings:", error);
			});
		}, SYNC_DEBOUNCE_MS);

		return () => {
			if (syncTimeoutRef.current) {
				clearTimeout(syncTimeoutRef.current);
				syncTimeoutRef.current = null;
			}
		};
	}, [isLoaded, replaceSettings, settings, writeSerializedSettings]);

	const value = useMemo<SettingsContextState>(
		() => ({ settings, setSettings, resetSettings, saveSettings }),
		[resetSettings, saveSettings, settings],
	);

	return (
		<SettingsContext.Provider value={value}>
			{isLoaded && children}
		</SettingsContext.Provider>
	);
};

const useSettings = () => {
	const context = useContext(SettingsContext);

	if (!context) {
		throw new Error("useSettings must be used within a SettingsProvider");
	}

	return context;
};

export { SettingsProvider, useSettings };
