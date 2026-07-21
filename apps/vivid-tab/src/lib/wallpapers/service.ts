import { LAST_ONLINE_IMAGES_FETCHED_AT } from "@/constants/keys";
import {
	resolveStoredSettings,
	SETTINGS_STORAGE_KEY,
	serializeSettings,
} from "@/lib/settings-storage";
import { openImageDB, type StoredImage } from "./database";
import { Wallhaven, type WallhavenImage } from "./wallhaven";

const ONLINE_IMAGE_REFRESH_INTERVAL_MS = 60 * 60 * 1000;
const ONLINE_IMAGE_DOWNLOAD_CONCURRENCY = 4;

type DownloadedWallhavenImage = WallhavenImage & {
	cachedSrc: Blob;
};

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
	 * Downloads full-resolution images before any cached records are replaced.
	 * Invalid or failed responses are omitted so a partially available provider
	 * can still refresh the usable portion of the gallery.
	 */
	private async _downloadOnlineImages(
		images: readonly WallhavenImage[],
	): Promise<DownloadedWallhavenImage[]> {
		const uniqueImages = [
			...new Map(images.map((image) => [image.src, image])).values(),
		];
		const downloaded = new Array<DownloadedWallhavenImage | undefined>(
			uniqueImages.length,
		);
		let nextIndex = 0;

		const worker = async () => {
			while (nextIndex < uniqueImages.length) {
				const index = nextIndex;
				nextIndex += 1;
				/* The loop guard and synchronous increment keep this index in range. */
				const image = uniqueImages[index] as WallhavenImage;

				try {
					const response = await fetch(image.src);
					if (!response.ok) continue;

					const cachedSrc = await response.blob();
					if (
						cachedSrc.size === 0 ||
						!cachedSrc.type.toLowerCase().startsWith("image/")
					) {
						continue;
					}

					downloaded[index] = { ...image, cachedSrc };
				} catch {
					/* A failed image is skipped while other provider results continue. */
				}
			}
		};

		await Promise.all(
			Array.from(
				{
					length: Math.min(
						ONLINE_IMAGE_DOWNLOAD_CONCURRENCY,
						uniqueImages.length,
					),
				},
				worker,
			),
		);

		return downloaded.filter(
			(image): image is DownloadedWallhavenImage => image !== undefined,
		);
	}

	/**
	 * Replaces one provider's unbookmarked records atomically while leaving
	 * uploaded, bookmarked, and unknown-provider images intact. New results whose
	 * URL is already bookmarked are skipped to prevent duplicate gallery entries.
	 */
	private async _replaceOnlineImages(
		images: readonly DownloadedWallhavenImage[],
		bookmarkedImageIds: readonly string[],
	): Promise<ReplaceOnlineImagesResult> {
		const db = await openImageDB();
		const source = this._provider.sourceName;
		const now = Date.now();
		const bookmarkedIds = new Set(bookmarkedImageIds);

		try {
			return await new Promise<ReplaceOnlineImagesResult>((resolve, reject) => {
				const transaction = db.transaction("images", "readwrite");
				const store = transaction.objectStore("images");
				const getAllRequest = store.getAll();
				const removedIds = new Set<string>();
				const insertedIds: string[] = [];

				getAllRequest.onsuccess = () => {
					const storedRecords = getAllRequest.result as StoredImage[];
					const preservedUrls = new Set(
						storedRecords
							.filter(
								(image) =>
									image.source === source && bookmarkedIds.has(image.id),
							)
							.map(({ src }) => src),
					);

					for (const image of storedRecords) {
						if (image.source !== source) continue;
						if (bookmarkedIds.has(image.id)) continue;

						removedIds.add(image.id);
						store.delete(image.id);
					}

					for (const image of images) {
						if (preservedUrls.has(image.src)) continue;

						preservedUrls.add(image.src);
						const storedImage: StoredImage = {
							cachedSrc: image.cachedSrc,
							fetchedAt: now,
							id: `${source}_${now}_${crypto.randomUUID()}`,
							source,
							src: image.src,
							thumbnailSrc: image.thumbnailSrc,
						};
						insertedIds.push(storedImage.id);
						store.put(storedImage);
					}
				};

				transaction.oncomplete = () =>
					resolve({
						ids: insertedIds,
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
			const downloadedImages = await this._downloadOnlineImages(images);
			if (downloadedImages.length === 0) return;

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

			const { ids, removedIds } = await this._replaceOnlineImages(
				downloadedImages,
				currentWallpapers.bookmarkedImageIds,
			);

			/**
			 * @deprecated Preserve unknown provider IDs through v1.4.0, then remove
			 * this compatibility behavior in v1.5.0.
			 */
			const preservedIds = currentWallpapers.images.filter(
				(id) => !removedIds.has(id),
			);
			const nextImageIds = [...new Set([...preservedIds, ...ids])];
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
									? (nextImageIds[0] ?? null)
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
