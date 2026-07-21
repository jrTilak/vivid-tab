import { LAST_ONLINE_IMAGES_FETCHED_AT } from "@/constants/keys";
import {
	LEGACY_SETTINGS_STORAGE_KEY,
	resolveStoredSettings,
	SETTINGS_STORAGE_KEY,
	serializeSettings,
} from "@/lib/settings-storage";
import { openImageDB, type StoredImage } from "./database";
import { Wallhaven, type WallhavenImage } from "./wallhaven";

const ONLINE_IMAGE_REFRESH_INTERVAL_MS = 60 * 60 * 1000;

type ReplaceOnlineImagesResult = {
	ids: string[];
	removedIds: Set<string>;
};

class Wallpaper {
	private readonly _provider = new Wallhaven();
	private _refreshPromise: Promise<void> | null = null;
	private _refreshIsForced = false;
	private _forcedRefreshQueued = false;

	/**
	 * Replaces one provider's records atomically in a single IndexedDB
	 * transaction while leaving uploaded and unknown-provider images intact.
	 */
	private async _replaceOnlineImages(
		images: readonly WallhavenImage[],
	): Promise<ReplaceOnlineImagesResult> {
		const db = await openImageDB();
		const source = this._provider.sourceName;
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

	/**
	 * Refreshes cached online choices while coalescing simultaneous callers.
	 *
	 * Automatic refreshes honor rotation, cache age, and active-tab checks.
	 * Forced refreshes bypass those gates for onboarding and explicit UI actions.
	 *
	 * @param forceFetch - Whether to bypass automatic refresh throttling.
	 * @returns The shared in-flight refresh promise, if one already exists.
	 */
	fetchOnlineImages(forceFetch = false): Promise<void> {
		if (this._refreshPromise) {
			/* A UI refresh must not be swallowed by an automatic throttled request. */
			if (forceFetch && !this._refreshIsForced) {
				this._forcedRefreshQueued = true;
			}

			return this._refreshPromise;
		}

		this._refreshIsForced = forceFetch;
		this._refreshPromise = this._runRefreshQueue(forceFetch).finally(() => {
			this._refreshPromise = null;
			this._refreshIsForced = false;
			this._forcedRefreshQueued = false;
		});

		return this._refreshPromise;
	}

	/**
	 * Drains one queued forced refresh after the current automatic refresh. This
	 * preserves explicit user intent without allowing an unbounded request queue.
	 */
	private async _runRefreshQueue(forceFetch: boolean): Promise<void> {
		await this._refreshOnlineImages(forceFetch);

		if (!this._forcedRefreshQueued) return;

		this._forcedRefreshQueued = false;
		this._refreshIsForced = true;
		await this._refreshOnlineImages(true);
	}

	/**
	 * Applies refresh policy, fetches remote choices, then reconciles IndexedDB
	 * IDs with the latest settings value to preserve concurrent user changes.
	 */
	private async _refreshOnlineImages(forceFetch: boolean): Promise<void> {
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

			const images = await this._provider.fetchImages(
				wallpapers.onlineImages.keywords.split(","),
				20,
			);

			if (images.length === 0) return;

			/*
			 * Fetching can take seconds. Re-read before touching IndexedDB so disabling
			 * online images during the request takes effect and other changes survive.
			 */
			const latestResult = await chrome.storage.sync.get(SETTINGS_STORAGE_KEY);
			const latest = resolveStoredSettings(
				latestResult[SETTINGS_STORAGE_KEY],
			).settings;
			const currentWallpapers = latest.appearance.wallpapers;
			if (!currentWallpapers.onlineImages.enabled) return;

			const { ids, removedIds } = await this._replaceOnlineImages(images);
			const firstNewImageId = ids[0];
			if (!firstNewImageId) return;

			/**
			 * @deprecated Preserve unknown provider IDs through v1.4.0, then remove
			 * this compatibility behavior in v1.5.0.
			 */
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
									? firstNewImageId
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

/**
 * Shared online-wallpaper service for background alarms and settings actions.
 */
export const wallpaper = new Wallpaper();
