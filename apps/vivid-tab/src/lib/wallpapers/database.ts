const IMAGE_DB_NAME = "ImageDB";
const IMAGE_DB_VERSION = 2;

/**
 * Wallpaper metadata persisted in IndexedDB. Uploaded images store their data
 * URL in `src`; remote images may provide a smaller gallery thumbnail.
 */
export interface StoredImage {
	id: string;
	src: string;
	source: string;
	fetchedAt: number;
	/** Full-resolution remote image cached for instant, offline display. */
	cachedSrc?: Blob;
	/** Used by the gallery so it does not download every full-resolution image. */
	thumbnailSrc?: string;
}

/**
 * Opens the shared IndexedDB database used for uploaded and online wallpapers.
 *
 * The caller owns the returned connection and must close it after its
 * transaction completes.
 *
 * @returns An open connection whose `images` store is ready for transactions.
 */
export const openImageDB = (): Promise<IDBDatabase> =>
	new Promise((resolve, reject) => {
		const request = indexedDB.open(IMAGE_DB_NAME, IMAGE_DB_VERSION);

		request.onupgradeneeded = () => {
			const db = request.result;

			if (!db.objectStoreNames.contains("images")) {
				db.createObjectStore("images", { keyPath: "id" });
			}
		};

		request.onsuccess = () => resolve(request.result);
		request.onerror = () =>
			reject(
				new Error(
					`Failed to open ImageDB: ${request.error?.message ?? "unknown error"}`,
				),
			);
	});

/**
 * Deletes the complete wallpaper database, including uploaded image data.
 *
 * @returns A promise that settles when IndexedDB finishes the delete request.
 */
export const deleteWallpaperDatabase = (): Promise<void> =>
	new Promise((resolve, reject) => {
		const request = indexedDB.deleteDatabase(IMAGE_DB_NAME);
		request.onsuccess = () => resolve();
		request.onerror = () =>
			reject(
				request.error ?? new Error("Failed to delete the wallpaper database"),
			);
	});
