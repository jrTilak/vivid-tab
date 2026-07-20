import { LAST_ONLINE_IMAGES_FETCHED_AT } from "@/constants/keys";
import {
	LEGACY_SETTINGS_STORAGE_KEY,
	resolveStoredSettings,
	SETTINGS_STORAGE_KEY,
	serializeSettings,
} from "@/lib/settings-storage";
import { openImageDB, type StoredImage } from "@/lib/wallpaper-database";
import { Wallhaven, type WallhavenImage } from "./extensions/wallhaven";

const ONLINE_IMAGE_REFRESH_INTERVAL_MS = 60 * 60 * 1000;

type ReplaceOnlineImagesResult = {
	ids: string[];
	removedIds: Set<string>;
};

class Wallpaper {
	private readonly provider = new Wallhaven();
	private refreshPromise: Promise<void> | null = null;

	/** Replaces one provider's records atomically in a single IndexedDB transaction. */
	private async replaceOnlineImages(
		images: readonly WallhavenImage[],
	): Promise<ReplaceOnlineImagesResult> {
		const db = await openImageDB();
		const source = this.provider.sourceName;
		const now = Date.now();
		const storedImages = images.map<StoredImage>(({ src, thumbnailSrc }) => ({
			fetchedAt: now,
			id: `${source}_${now}_${crypto.randomUUID()}`,
			source,
			src,
			thumbnailSrc,
		}));

		try {
			return await new Promise<ReplaceOnlineImagesResult>((resolve, reject) => {
				const transaction = db.transaction("images", "readwrite");
				const store = transaction.objectStore("images");
				const getAllRequest = store.getAll();
				const removedIds = new Set<string>();

				getAllRequest.onsuccess = () => {
					for (const image of getAllRequest.result as StoredImage[]) {
						if (image.source !== source) continue;

						removedIds.add(image.id);
						store.delete(image.id);
					}

					for (const image of storedImages) store.put(image);
				};

				transaction.oncomplete = () =>
					resolve({
						ids: storedImages.map(({ id }) => id),
						removedIds,
					});
				transaction.onerror = () =>
					reject(
						transaction.error ?? new Error("Failed to replace wallpapers"),
					);
				transaction.onabort = () =>
					reject(
						transaction.error ?? new Error("Replacing wallpapers was aborted"),
					);
			});
		} finally {
			db.close();
		}
	}

	/** Coalesces alarm and UI refreshes so they cannot replace each other's IDs. */
	fetchOnlineImages(forceFetch = false): Promise<void> {
		this.refreshPromise ??= this.refreshOnlineImages(forceFetch).finally(() => {
			this.refreshPromise = null;
		});

		return this.refreshPromise;
	}

	/** Fetches fresh online wallpapers and stores only their remote URLs. */
	private async refreshOnlineImages(forceFetch: boolean): Promise<void> {
		try {
			const result = await chrome.storage.sync.get(SETTINGS_STORAGE_KEY);
			const resolved = resolveStoredSettings(result[SETTINGS_STORAGE_KEY]);

			if (resolved.shouldPersist) {
				await chrome.storage.sync.set({
					[SETTINGS_STORAGE_KEY]: resolved.serialized,
					...(resolved.legacyBackup === undefined
						? {}
						: {
								[LEGACY_SETTINGS_STORAGE_KEY]: resolved.legacyBackup,
							}),
				});
			}

			const { background, wallpapers } = resolved.settings.appearance;

			if (!wallpapers.onlineImages.enabled) return;
			if (!forceFetch && background.randomizeWallpaper === "off") return;

			if (!forceFetch) {
				const lastFetchResult = await chrome.storage.local.get(
					LAST_ONLINE_IMAGES_FETCHED_AT,
				);
				const lastFetchedAt = Number(
					lastFetchResult[LAST_ONLINE_IMAGES_FETCHED_AT],
				);

				if (
					Number.isFinite(lastFetchedAt) &&
					Date.now() - lastFetchedAt < ONLINE_IMAGE_REFRESH_INTERVAL_MS
				) {
					return;
				}

				const activeTabs = await chrome.tabs.query({ active: true });
				if (activeTabs.length === 0) return;
			}

			const images = await this.provider.fetchImages(
				wallpapers.onlineImages.keywords.split(","),
				20,
			);

			if (images.length === 0) return;

			const { ids, removedIds } = await this.replaceOnlineImages(images);
			if (ids.length === 0) return;

			/*
			 * Fetching can take seconds. Re-read settings before writing so changes made
			 * during the request survive. Unknown legacy-provider records are retained.
			 */
			const latestResult = await chrome.storage.sync.get(SETTINGS_STORAGE_KEY);
			const latest = resolveStoredSettings(
				latestResult[SETTINGS_STORAGE_KEY],
			).settings;
			const currentWallpapers = latest.appearance.wallpapers;
			const preservedIds = currentWallpapers.images.filter(
				(id) => !removedIds.has(id),
			);
			const nextImageIds = [...preservedIds, ...ids];
			const selectedImageId = currentWallpapers.selectedImageId;

			await chrome.storage.sync.set({
				[SETTINGS_STORAGE_KEY]: serializeSettings({
					...latest,
					appearance: {
						...latest.appearance,
						wallpapers: {
							...currentWallpapers,
							images: nextImageIds,
							selectedImageId:
								selectedImageId && !nextImageIds.includes(selectedImageId)
									? (ids[0] ?? null)
									: selectedImageId,
						},
					},
				}),
			});

			await chrome.storage.local.set({
				[LAST_ONLINE_IMAGES_FETCHED_AT]: Date.now().toString(),
			});
		} catch (error) {
			console.error("Failed to refresh online wallpapers:", error);
		}
	}
}

export const wallpaper = new Wallpaper();
