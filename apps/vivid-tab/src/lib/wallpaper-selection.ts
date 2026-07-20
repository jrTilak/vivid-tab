type WallpaperRotation = "off" | "on-each-tab" | "hourly" | "daily";

const HOUR_MS = 60 * 60 * 1000;

export const selectRandomWallpaperId = (
	imageIds: readonly string[],
	currentImageId: string | null,
	random: () => number = Math.random,
): string | null => {
	if (imageIds.length === 0) return null;
	if (imageIds.length === 1) return imageIds[0] ?? null;

	const currentIndex = currentImageId ? imageIds.indexOf(currentImageId) : -1;
	let nextIndex: number;

	/* Map a smaller random range around the current slot to guarantee a change. */
	if (currentIndex >= 0) {
		nextIndex = Math.floor(random() * (imageIds.length - 1));
		if (nextIndex >= currentIndex) nextIndex += 1;
	} else {
		nextIndex = Math.floor(random() * imageIds.length);
	}

	return imageIds[nextIndex] ?? imageIds[0] ?? null;
};

export const getWallpaperRotationInterval = (
	rotation: WallpaperRotation,
): number | null => {
	switch (rotation) {
		case "hourly":
			return HOUR_MS;
		case "daily":
			return 24 * HOUR_MS;
		default:
			return null;
	}
};

const parseStoredTimestamp = (value: unknown): number | null => {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value !== "string" || value.trim() === "") return null;

	const numericTimestamp = Number(value);
	if (Number.isFinite(numericTimestamp)) return numericTimestamp;

	const legacyTimestamp = Date.parse(value);
	return Number.isFinite(legacyTimestamp) ? legacyTimestamp : null;
};

export const isWallpaperRotationDue = (
	lastChangedAt: unknown,
	interval: number,
	now = Date.now(),
): boolean => {
	const timestamp = parseStoredTimestamp(lastChangedAt);

	return timestamp === null || now - timestamp >= interval;
};
