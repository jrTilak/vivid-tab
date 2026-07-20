import { useCallback } from "react";
import { LAST_WALLPAPER_CHANGED_AT } from "@/constants/keys";
import { selectRandomWallpaperId } from "@/lib/wallpaper-selection";
import { useSettings } from "@/providers/settings-provider";

export const useNextWallpaper = () => {
	const {
		settings: {
			appearance: { wallpapers },
		},
		setSettings,
	} = useSettings();

	const nextWallpaper = useCallback(() => {
		const nextImageId = selectRandomWallpaperId(
			wallpapers.images,
			wallpapers.selectedImageId,
		);

		if (!nextImageId) return;

		void chrome.storage.local
			.set({
				[LAST_WALLPAPER_CHANGED_AT]: Date.now().toString(),
			})
			.then(() => {
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
				console.error("Failed to select the next wallpaper:", error);
			});
	}, [setSettings, wallpapers.images, wallpapers.selectedImageId]);

	return {
		nextWallpaper,
		hasWallpapers: wallpapers.images.length > 0,
	};
};
