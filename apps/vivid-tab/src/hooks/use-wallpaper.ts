import { useCallback, useEffect, useRef, useState } from "react";
import { LAST_WALLPAPER_CHANGED_AT } from "@/constants/keys";
import {
	getWallpaperRotationInterval,
	isWallpaperRotationDue,
	selectRandomWallpaperId,
} from "@/lib/wallpaper-selection";
import { useSettings } from "@/providers/settings-provider";
import { useImage } from "./use-image";

export const useWallpaper = () => {
	const {
		settings: {
			appearance: { wallpapers, background },
		},
		setSettings,
	} = useSettings();

	const getRandomImageId = useCallback(
		(currentImageId: string | null) =>
			selectRandomWallpaperId(wallpapers.images, currentImageId),
		[wallpapers.images],
	);
	const [sessionImageId, setSessionImageId] = useState<string | null>(() =>
		background.randomizeWallpaper === "on-each-tab"
			? getRandomImageId(wallpapers.selectedImageId)
			: wallpapers.selectedImageId,
	);
	const lastSelectedImageIdRef = useRef<string | null>(
		wallpapers.selectedImageId,
	);

	useEffect(() => {
		if (background.randomizeWallpaper !== "on-each-tab") {
			setSessionImageId(wallpapers.selectedImageId);
			lastSelectedImageIdRef.current = wallpapers.selectedImageId;

			return;
		}

		if (wallpapers.images.length === 0) {
			setSessionImageId(null);

			return;
		}

		if (wallpapers.selectedImageId !== lastSelectedImageIdRef.current) {
			lastSelectedImageIdRef.current = wallpapers.selectedImageId;

			if (
				wallpapers.selectedImageId &&
				wallpapers.images.includes(wallpapers.selectedImageId)
			) {
				setSessionImageId(wallpapers.selectedImageId);

				return;
			}
		}

		if (!sessionImageId || !wallpapers.images.includes(sessionImageId)) {
			setSessionImageId(getRandomImageId(wallpapers.selectedImageId));
		}
	}, [
		background.randomizeWallpaper,
		getRandomImageId,
		sessionImageId,
		wallpapers.images,
		wallpapers.selectedImageId,
	]);

	const activeImageId =
		background.randomizeWallpaper === "on-each-tab"
			? sessionImageId
			: wallpapers.selectedImageId;
	const rotationInterval = getWallpaperRotationInterval(
		background.randomizeWallpaper,
	);

	useEffect(() => {
		if (rotationInterval === null || wallpapers.images.length === 0) return;

		let cancelled = false;

		void chrome.storage.local
			.get(LAST_WALLPAPER_CHANGED_AT)
			.then(async (result) => {
				if (
					cancelled ||
					!isWallpaperRotationDue(
						result[LAST_WALLPAPER_CHANGED_AT],
						rotationInterval,
					)
				) {
					return;
				}

				const nextImageId = getRandomImageId(wallpapers.selectedImageId);
				if (!nextImageId) return;

				/* Persist first so the resulting render cannot start another rotation. */
				await chrome.storage.local.set({
					[LAST_WALLPAPER_CHANGED_AT]: Date.now().toString(),
				});

				if (cancelled) return;

				setSettings((previous) => ({
					...previous,
					appearance: {
						...previous.appearance,
						wallpapers: {
							...previous.appearance.wallpapers,
							selectedImageId: nextImageId,
						},
					},
				}));
			})
			.catch((error) => {
				if (!cancelled) {
					console.error("Failed to rotate the wallpaper:", error);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [
		getRandomImageId,
		rotationInterval,
		setSettings,
		wallpapers.images.length,
		wallpapers.selectedImageId,
	]);

	const imageData = useImage(activeImageId);

	return { imageData, activeImageId };
};
