export const BOOKMARK_ICON_UPDATE_EVENT = "bookmarks:update";
export const BOOKMARK_ICON_STORAGE_PREFIX = "icon-";

export type BookmarkIconUpdateDetail = {
	id: string;
};

export const getBookmarkIconStorageKey = (bookmarkId: string) =>
	`${BOOKMARK_ICON_STORAGE_PREFIX}${bookmarkId}`;

/** Extracts a usable icon URL from untrusted extension storage. */
export const parseStoredBookmarkIcon = (
	storedValue: unknown,
): string | null => {
	if (
		!storedValue ||
		typeof storedValue !== "object" ||
		!("icon" in storedValue)
	) {
		return null;
	}

	const { icon } = storedValue as { icon?: unknown };

	return typeof icon === "string" && icon.length > 0 ? icon : null;
};

export const notifyBookmarkIconChanged = (bookmarkId: string) => {
	window.dispatchEvent(
		new CustomEvent<BookmarkIconUpdateDetail>(BOOKMARK_ICON_UPDATE_EVENT, {
			detail: { id: bookmarkId },
		}),
	);
};
