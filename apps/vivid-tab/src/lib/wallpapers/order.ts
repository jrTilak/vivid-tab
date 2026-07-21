const isManualWallpaperId = (id: string) => /^local[_-]/.test(id);

/**
 * Groups wallpaper IDs for the gallery without changing order inside a group.
 * Current and legacy manual uploads are identified by their `local_` or
 * `local-` prefix; unknown legacy IDs remain in the final compatibility group.
 *
 * Duplicate and stale bookmark entries do not create duplicate gallery cards.
 */
export const orderWallpaperIds = (
	imageIds: readonly string[],
	bookmarkedImageIds: readonly string[],
): string[] => {
	const bookmarkedIds = new Set(bookmarkedImageIds);
	const uniqueIds = [...new Set(imageIds)];

	return [
		...uniqueIds.filter(isManualWallpaperId),
		...uniqueIds.filter(
			(id) => !isManualWallpaperId(id) && bookmarkedIds.has(id),
		),
		...uniqueIds.filter(
			(id) => !isManualWallpaperId(id) && !bookmarkedIds.has(id),
		),
	];
};
