type WallpaperRotation = "off" | "on-each-tab" | "hourly" | "daily";

const HOUR_MS = 60 * 60 * 1000;

/**
 * Selects a wallpaper ID while avoiding the current image when alternatives
 * exist. Injecting `random` keeps the selection deterministic in tests.
 *
 * @param imageIds - Available wallpaper IDs in gallery order.
 * @param currentImageId - The currently displayed wallpaper, if any.
 * @param random - A function returning a value in the `0 <= value < 1` range.
 * @returns A selected ID, or `null` when the gallery is empty.
 *
 * @example
 * selectRandomWallpaperId(["first", "second"], "first", () => 0);
 * // Returns "second".
 */
export const selectRandomWallpaperId = (
	imageIds: readonly string[],
	currentImageId: string | null,
	random: () => number = Math.random,
): string | null => {
	const firstImageId = imageIds[0];
	if (firstImageId === undefined) return null;
	if (imageIds.length === 1) return firstImageId;

	const currentIndex = currentImageId ? imageIds.indexOf(currentImageId) : -1;
	let nextIndex: number;

	/* Map a smaller random range around the current slot to guarantee a change. */
	if (currentIndex >= 0) {
		nextIndex = Math.floor(random() * (imageIds.length - 1));
		if (nextIndex >= currentIndex) nextIndex += 1;
	} else {
		nextIndex = Math.floor(random() * imageIds.length);
	}

	return imageIds[nextIndex] ?? firstImageId;
};

/**
 * Converts a persisted rotation mode into its periodic interval.
 *
 * Per-tab and disabled rotation do not use a timer and therefore return null.
 *
 * @param rotation - The configured wallpaper rotation mode.
 * @returns The interval in milliseconds, or `null` for non-periodic modes.
 */
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

	/**
	 * @deprecated Date-string timestamps are accepted through v1.4.0 only;
	 * remove this fallback in v1.5.0.
	 */
	const legacyTimestamp = Date.parse(value);
	return Number.isFinite(legacyTimestamp) ? legacyTimestamp : null;
};

/**
 * Determines whether enough time has passed to rotate the wallpaper.
 *
 * Numeric timestamps, numeric strings, and legacy date strings are accepted.
 * Missing or corrupt values are treated as due so rotation can recover.
 *
 * @param lastChangedAt - The untrusted timestamp read from browser storage.
 * @param interval - Required elapsed time in milliseconds.
 * @param now - Current epoch time, injectable for deterministic tests.
 * @returns Whether the wallpaper should rotate now.
 *
 * @example
 * isWallpaperRotationDue("1720000000000", 3_600_000, 1720003600000);
 * // Returns true.
 */
export const isWallpaperRotationDue = (
	lastChangedAt: unknown,
	interval: number,
	now = Date.now(),
): boolean => {
	const timestamp = parseStoredTimestamp(lastChangedAt);

	return timestamp === null || now - timestamp >= interval;
};
