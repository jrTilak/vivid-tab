import { useEffect, useState } from "react";
import { openImageDB, type StoredImage } from "@/lib/wallpapers/database";

/**
 * Retrieves an image from IndexedDB using its ID
 * Params: imageId (string | null) - ID of the image to retrieve
 * Returns: object with image data including source metadata
 */
const useImage = (imageId: string | null) => {
	const [imageData, setImageData] = useState<StoredImage | null>(null);

	useEffect(() => {
		if (!imageId) {
			setImageData(null);

			return;
		}

		setImageData(null);
		let cancelled = false;
		let db: IDBDatabase | null = null;

		openImageDB()
			.then((database) => {
				db = database;
				const transaction = database.transaction("images", "readonly");
				const store = transaction.objectStore("images");
				const getRequest = store.get(imageId);

				getRequest.onsuccess = () => {
					if (cancelled) return;

					setImageData((getRequest.result as StoredImage | undefined) ?? null);
				};

				getRequest.onerror = () => {
					if (!cancelled) setImageData(null);
				};

				transaction.oncomplete = () => database.close();
				transaction.onabort = () => database.close();
				transaction.onerror = () => database.close();
			})
			.catch(() => {
				db?.close();
				if (!cancelled) setImageData(null);
			});

		return () => {
			cancelled = true;
		};
	}, [imageId]);

	return imageData;
};

export { useImage };
