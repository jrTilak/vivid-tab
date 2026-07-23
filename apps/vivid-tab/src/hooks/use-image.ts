import { useEffect, useState } from "react";
import { openImageDB, type StoredImage } from "@/lib/wallpapers/database";

/**
 * Retrieves a wallpaper and exposes its cached Blob through a temporary object
 * URL. Local and legacy records without a Blob continue to use their stored
 * source directly. Object URLs are revoked when the record changes or unmounts.
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
		let objectUrl: string | null = null;

		openImageDB()
			.then((database) => {
				db = database;
				const transaction = database.transaction("images", "readonly");
				const store = transaction.objectStore("images");
				const getRequest = store.get(imageId);

				getRequest.onsuccess = () => {
					if (cancelled) return;

					const storedImage = getRequest.result as StoredImage | undefined;
					if (!storedImage) {
						setImageData(null);

						return;
					}

					if (storedImage.cachedSrc) {
						try {
							objectUrl = URL.createObjectURL(storedImage.cachedSrc);
						} catch {
							objectUrl = null;
						}
					}

					setImageData(
						objectUrl ? { ...storedImage, src: objectUrl } : storedImage,
					);
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
			if (objectUrl) URL.revokeObjectURL(objectUrl);
		};
	}, [imageId]);

	return imageData;
};

export { useImage };
