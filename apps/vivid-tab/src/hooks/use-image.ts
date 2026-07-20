import { useEffect, useState } from "react";
import { openImageDB, type StoredImage } from "@/lib/wallpapers";

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

		let db: IDBDatabase | null = null;

		openImageDB()
			.then((database) => {
				db = database;
				const transaction = database.transaction("images", "readonly");
				const store = transaction.objectStore("images");
				const getRequest = store.get(imageId);

				getRequest.onsuccess = () => {
					db?.close();

					if (getRequest.result) {
						const result = getRequest.result as StoredImage;
						setImageData(result);

						if (!result.downloaded && result.source !== "local") {
							import("@/lib/wallpapers").then(({ wallpaper }) => {
								wallpaper.downloadPendingImages().catch(console.error);
							});
						}
					} else {
						setImageData(null);
					}
				};

				getRequest.onerror = () => {
					db?.close();
					setImageData(null);
				};
			})
			.catch(() => {
				db?.close();
				setImageData(null);
			});
	}, [imageId]);

	return imageData;
};

export { useImage };
