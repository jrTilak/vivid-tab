import {
	BOOKMARK_ICON_UPDATE_EVENT,
	getBookmarkIconStorageKey,
	notifyBookmarkIconChanged,
	parseStoredBookmarkIcon,
} from "@/lib/bookmark-icons";

type StoredBookmarkIcon = {
	icon: string;
};

type EditableIcon = string | null | undefined;

type SaveBookmarkInput = {
	bookmarkId?: string;
	icon: EditableIcon;
	parentId?: string;
	title: string;
	url: string;
};

type SaveFolderInput = Omit<SaveBookmarkInput, "url">;

const getRuntimeError = () => {
	const runtimeError = chrome.runtime.lastError;

	return runtimeError ? new Error(runtimeError.message) : undefined;
};

const createBookmark = (
	bookmark: chrome.bookmarks.CreateDetails,
): Promise<chrome.bookmarks.BookmarkTreeNode> =>
	new Promise((resolve, reject) => {
		chrome.bookmarks.create(bookmark, (createdBookmark) => {
			const error = getRuntimeError();
			error ? reject(error) : resolve(createdBookmark);
		});
	});

const updateBookmark = (
	bookmarkId: string,
	changes: chrome.bookmarks.UpdateChanges,
): Promise<chrome.bookmarks.BookmarkTreeNode> =>
	new Promise((resolve, reject) => {
		chrome.bookmarks.update(bookmarkId, changes, (updatedBookmark) => {
			const error = getRuntimeError();
			error ? reject(error) : resolve(updatedBookmark);
		});
	});

const removeBookmark = (bookmarkId: string): Promise<void> =>
	new Promise((resolve, reject) => {
		chrome.bookmarks.remove(bookmarkId, () => {
			const error = getRuntimeError();
			error ? reject(error) : resolve();
		});
	});

const readStorageValue = (key: string): Promise<Record<string, unknown>> =>
	new Promise((resolve, reject) => {
		chrome.storage.local.get(key, (items) => {
			const error = getRuntimeError();
			error ? reject(error) : resolve(items);
		});
	});

const writeStorageValue = (key: string, value: unknown): Promise<void> =>
	new Promise((resolve, reject) => {
		chrome.storage.local.set({ [key]: value }, () => {
			const error = getRuntimeError();
			error ? reject(error) : resolve();
		});
	});

const removeStorageValue = (key: string): Promise<void> =>
	new Promise((resolve, reject) => {
		chrome.storage.local.remove(key, () => {
			const error = getRuntimeError();
			error ? reject(error) : resolve();
		});
	});

/** Reads a custom icon without trusting the shape of persisted extension data. */
export const loadBookmarkIcon = async (
	bookmarkId: string,
): Promise<string | null> => {
	const key = getBookmarkIconStorageKey(bookmarkId);
	const storedValue = (await readStorageValue(key))[key];

	return parseStoredBookmarkIcon(storedValue);
};

/**
 * Persists all icon states, including explicit removal. `undefined` means the
 * icon could not be loaded, so the existing stored value must be preserved.
 */
export const persistBookmarkIcon = async (
	bookmarkId: string,
	icon: EditableIcon,
): Promise<void> => {
	if (icon === undefined) return;

	const key = getBookmarkIconStorageKey(bookmarkId);
	if (icon) {
		await writeStorageValue(key, { icon } satisfies StoredBookmarkIcon);
	} else {
		await removeStorageValue(key);
	}

	notifyBookmarkIconChanged(bookmarkId);
};

export {
	BOOKMARK_ICON_UPDATE_EVENT,
	notifyBookmarkIconChanged,
	parseStoredBookmarkIcon,
};

/** Converts a selected local image into the data URL stored by the extension. */
export const readIconFile = (file: File): Promise<string> => {
	if (!file.type.startsWith("image/")) {
		return Promise.reject(new Error("The selected file is not an image."));
	}

	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onerror = () =>
			reject(reader.error ?? new Error("Could not read the selected image."));
		reader.onabort = () =>
			reject(new Error("Reading the image was cancelled."));
		reader.onload = () => {
			if (typeof reader.result === "string") {
				resolve(reader.result);
				return;
			}

			reject(new Error("The selected image could not be converted."));
		};

		reader.readAsDataURL(file);
	});
};

/** Creates or updates a bookmark and then commits its custom icon. */
export const saveBookmark = async ({
	bookmarkId,
	icon,
	parentId,
	title,
	url,
}: SaveBookmarkInput): Promise<string> => {
	if (bookmarkId) {
		await updateBookmark(bookmarkId, { title, url });
		await persistBookmarkIcon(bookmarkId, icon);
		return bookmarkId;
	}

	const createdBookmark = await createBookmark({ parentId, title, url });

	try {
		if (icon) await persistBookmarkIcon(createdBookmark.id, icon);
		return createdBookmark.id;
	} catch (error) {
		// Avoid creating a duplicate if the user retries after icon storage fails.
		try {
			await removeBookmark(createdBookmark.id);
		} catch (rollbackError) {
			console.error("Failed to roll back bookmark creation:", rollbackError);
		}

		throw error;
	}
};

/** Creates or updates a folder and then commits its custom icon. */
export const saveBookmarkFolder = async ({
	bookmarkId,
	icon,
	parentId,
	title,
}: SaveFolderInput): Promise<string> => {
	if (bookmarkId) {
		await updateBookmark(bookmarkId, { title });
		await persistBookmarkIcon(bookmarkId, icon);
		return bookmarkId;
	}

	const createdFolder = await createBookmark({ parentId, title });

	try {
		if (icon) await persistBookmarkIcon(createdFolder.id, icon);
		return createdFolder.id;
	} catch (error) {
		try {
			await removeBookmark(createdFolder.id);
		} catch (rollbackError) {
			console.error("Failed to roll back folder creation:", rollbackError);
		}

		throw error;
	}
};
