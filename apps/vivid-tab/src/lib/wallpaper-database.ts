const IMAGE_DB_NAME = "ImageDB";
const IMAGE_DB_VERSION = 2;

export interface StoredImage {
	id: string;
	src: string;
	source: string;
	fetchedAt: number;
	/** Used by the gallery so it does not download every full-resolution image. */
	thumbnailSrc?: string;
}

/** Opens the wallpaper database. Callers close the connection after a transaction. */
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
			reject(new Error(`Failed to open ImageDB: ${request.error?.message}`));
	});

/** Resolves after IndexedDB has removed all stored wallpaper records. */
export const deleteWallpaperDatabase = (): Promise<void> =>
	new Promise((resolve, reject) => {
		const request = indexedDB.deleteDatabase(IMAGE_DB_NAME);
		request.onsuccess = () => resolve();
		request.onerror = () =>
			reject(
				request.error ?? new Error("Failed to delete the wallpaper database"),
			);
	});
