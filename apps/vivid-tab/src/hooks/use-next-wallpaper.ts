import { LAST_WALLPAPER_CHANGED_AT } from "@/constants/keys";
import { randomInt } from "@/lib/random";
import { useSettings } from "@/providers/settings-provider";

/**
 * Hook to manage next wallpaper functionality
 */
export const useNextWallpaper = () => {
	const {
		settings: { wallpapers },
		setSettings,
	} = useSettings();

	const nextWallpaper = () => {
		if (wallpapers.images.length === 0) return;

		const currentImageIndex = wallpapers.images.indexOf(
			wallpapers.selectedImageId ?? undefined,
		);

		const excludeIndices = currentImageIndex >= 0 ? [currentImageIndex] : [];
		const maxIndex = wallpapers.images.length - 1;
		const randomIndex = randomInt(
			0,
			maxIndex < 0 ? 0 : maxIndex,
			excludeIndices,
		);
		const newImageId =
			wallpapers.images[randomIndex] ?? wallpapers.images[0] ?? null;

		setSettings((prev) => ({
			...prev,
			wallpapers: {
				...prev.wallpapers,
				selectedImageId: newImageId,
			},
		}));

		// Update last changed timestamp
		chrome.storage.local.set({
			[LAST_WALLPAPER_CHANGED_AT]: Date.now().toString(),
		});
	};

	return {
		nextWallpaper,
		hasWallpapers: wallpapers.images.length > 0,
	};
};
