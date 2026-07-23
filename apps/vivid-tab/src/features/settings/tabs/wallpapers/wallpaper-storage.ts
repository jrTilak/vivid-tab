import { openImageDB, type StoredImage } from "@/lib/wallpapers/database";

const readImageAsDataUrl = (file: File): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () =>
			typeof reader.result === "string"
				? resolve(reader.result)
				: reject(new Error("The selected image could not be read"));
		reader.onerror = () =>
			reject(reader.error ?? new Error("The selected image could not be read"));
		reader.readAsDataURL(file);
	});

/** Stores a local wallpaper and resolves only after IndexedDB commits it. */
export const storeLocalWallpaper = async (file: File): Promise<string> => {
	const src = await readImageAsDataUrl(file);
	const id = `local_${Date.now()}_${crypto.randomUUID()}`;
	const image: StoredImage = {
		id,
		src,
		source: "local",
		fetchedAt: Date.now(),
	};
	const db = await openImageDB();

	try {
		await new Promise<void>((resolve, reject) => {
			const transaction = db.transaction("images", "readwrite");
			transaction.objectStore("images").put(image);
			transaction.oncomplete = () => resolve();
			transaction.onerror = () =>
				reject(transaction.error ?? new Error("Failed to store the image"));
			transaction.onabort = () =>
				reject(transaction.error ?? new Error("Storing the image was aborted"));
		});
	} finally {
		db.close();
	}

	return id;
};

/** Deletes a wallpaper and resolves only after IndexedDB commits the change. */
export const deleteStoredWallpaper = async (id: string): Promise<void> => {
	const db = await openImageDB();

	try {
		await new Promise<void>((resolve, reject) => {
			const transaction = db.transaction("images", "readwrite");
			transaction.objectStore("images").delete(id);
			transaction.oncomplete = () => resolve();
			transaction.onerror = () =>
				reject(transaction.error ?? new Error("Failed to delete the image"));
			transaction.onabort = () =>
				reject(
					transaction.error ?? new Error("Deleting the image was aborted"),
				);
		});
	} finally {
		db.close();
	}
};
