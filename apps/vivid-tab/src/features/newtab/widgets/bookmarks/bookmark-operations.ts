import { getBookmarkIconStorageKey } from "@/lib/bookmark-icons";

const getRuntimeError = () => {
	const runtimeError = chrome.runtime.lastError;

	return runtimeError ? new Error(runtimeError.message) : undefined;
};

export const moveBookmark = (
	bookmarkId: string,
	destination: chrome.bookmarks.MoveDestination,
): Promise<void> =>
	new Promise((resolve, reject) => {
		chrome.bookmarks.move(bookmarkId, destination, () => {
			const error = getRuntimeError();
			error ? reject(error) : resolve();
		});
	});

const removeBookmark = (
	bookmarkId: string,
	recursive: boolean,
): Promise<void> =>
	new Promise((resolve, reject) => {
		const done = () => {
			const error = getRuntimeError();
			error ? reject(error) : resolve();
		};

		if (recursive) {
			chrome.bookmarks.removeTree(bookmarkId, done);
			return;
		}

		chrome.bookmarks.remove(bookmarkId, done);
	});

const removeBookmarkStorage = (
	bookmarkId: string,
	url?: string,
): Promise<void> =>
	new Promise((resolve, reject) => {
		const keys = [
			getBookmarkIconStorageKey(bookmarkId),
			...(url ? [`favicon-${url}`] : []),
		];

		chrome.storage.local.remove(keys, () => {
			const error = getRuntimeError();
			error ? reject(error) : resolve();
		});
	});

interface DeleteBookmarkOptions {
	isFolder: boolean;
	url?: string;
}

/** Deletes the browser node first; stale cache cleanup never blocks success. */
export const deleteBookmark = async (
	bookmarkId: string,
	options: DeleteBookmarkOptions,
): Promise<void> => {
	await removeBookmark(bookmarkId, options.isFolder);

	try {
		await removeBookmarkStorage(bookmarkId, options.url);
	} catch (error) {
		console.warn("Deleted bookmark but could not remove cached icon:", error);
	}
};
