import { useEffect, useRef, useState } from "react";
import { LAST_WALLPAPER_CHANGED_AT } from "@/constants/keys";
import { randomInt } from "@/lib/random";
import { useSettings } from "@/providers/settings-provider";
import { useImage } from "./use-image";

export const useWallpaper = () => {
	const {
		settings: { wallpapers, background },
		setSettings,
	} = useSettings();

	const getRandomImageId = (currentImageId: string | null) => {
		if (wallpapers.images.length === 0) return currentImageId ?? null;

		const currentImageIndex = wallpapers.images.indexOf(
			currentImageId ?? undefined,
		);
		const maxIndex = wallpapers.images.length - 1;
		const excludeIndices = currentImageIndex >= 0 ? [currentImageIndex] : [];
		const idx = randomInt(0, maxIndex < 0 ? 0 : maxIndex, excludeIndices);

		return wallpapers.images[idx] ?? wallpapers.images[0] ?? null;
	};

	const [sessionImageId, setSessionImageId] = useState<string | null>(() => {
		if (background.randomizeWallpaper !== "on-each-tab") {
			return wallpapers.selectedImageId ?? null;
		}

		return getRandomImageId(wallpapers.selectedImageId ?? null);
	});
	const lastSelectedImageIdRef = useRef<string | null>(
		wallpapers.selectedImageId ?? null,
	);

	useEffect(() => {
		if (background.randomizeWallpaper !== "on-each-tab") {
			setSessionImageId(wallpapers.selectedImageId ?? null);
			lastSelectedImageIdRef.current = wallpapers.selectedImageId ?? null;

			return;
		}

		if (wallpapers.images.length === 0) {
			setSessionImageId(null);

			return;
		}

		if (wallpapers.selectedImageId !== lastSelectedImageIdRef.current) {
			lastSelectedImageIdRef.current = wallpapers.selectedImageId ?? null;

			if (!wallpapers.selectedImageId) {
				setSessionImageId(null);

				return;
			}

			if (wallpapers.images.includes(wallpapers.selectedImageId)) {
				setSessionImageId(wallpapers.selectedImageId);

				return;
			}
		}

		if (!sessionImageId || !wallpapers.images.includes(sessionImageId)) {
			setSessionImageId(getRandomImageId(wallpapers.selectedImageId ?? null));
		}
	}, [
		background.randomizeWallpaper,
		sessionImageId,
		wallpapers.images,
		wallpapers.selectedImageId,
	]);

	const activeImageId =
		background.randomizeWallpaper === "on-each-tab"
			? sessionImageId
			: (wallpapers.selectedImageId ?? null);

	useEffect(() => {
		const updateSelectedImage = (newSelectedImageId: string | null) => {
			if (!newSelectedImageId) return;

			setSettings((prev) => ({
				...prev,
				wallpapers: {
					...prev.wallpapers,
					selectedImageId: newSelectedImageId,
				},
			}));

			chrome.storage.local.set({
				[LAST_WALLPAPER_CHANGED_AT]: Date.now().toString(),
			});
		};

		switch (background.randomizeWallpaper) {
			case "off":
				break;
			case "hourly":
				chrome.storage.local.get([LAST_WALLPAPER_CHANGED_AT], (result) => {
					const lastWallpaperChangedAt = result[LAST_WALLPAPER_CHANGED_AT];

					if (wallpapers.images.length > 0) {
						if (!lastWallpaperChangedAt) {
							updateSelectedImage(
								getRandomImageId(wallpapers.selectedImageId ?? null),
							);
						} else {
							const lastWallpaperChangedAtDate = new Date(
								lastWallpaperChangedAt,
							);
							const now = new Date();
							const diff = now.getTime() - lastWallpaperChangedAtDate.getTime();
							const diffInHours = diff / (1000 * 60 * 60);

							if (diffInHours >= 1) {
								updateSelectedImage(
									getRandomImageId(wallpapers.selectedImageId ?? null),
								);
							}
						}
					}
				});
				break;
			case "daily":
				chrome.storage.local.get([LAST_WALLPAPER_CHANGED_AT], (result) => {
					const lastWallpaperChangedAt = result[LAST_WALLPAPER_CHANGED_AT];

					if (wallpapers.images.length > 0) {
						if (!lastWallpaperChangedAt) {
							updateSelectedImage(
								getRandomImageId(wallpapers.selectedImageId ?? null),
							);
						} else {
							const lastWallpaperChangedAtDate = new Date(
								lastWallpaperChangedAt,
							);
							const now = new Date();
							const diff = now.getTime() - lastWallpaperChangedAtDate.getTime();
							const diffInHours = diff / (1000 * 60 * 60);

							if (diffInHours >= 24) {
								updateSelectedImage(
									getRandomImageId(wallpapers.selectedImageId ?? null),
								);
							}
						}
					}
				});
				break;
			default:
				break;
		}
	}, [
		background.randomizeWallpaper,
		setSettings,
		wallpapers.images,
		wallpapers.selectedImageId,
	]);

	const imageData = useImage(activeImageId);

	return { imageData, activeImageId };
};
