import * as z from "zod/mini";
import { ALARMS, BACKGROUND_ACTIONS } from "./constants/background-actions";
import {
	DEFAULT_BOOKMARK_FOLDER_NAME,
	LEGACY_BOOKMARK_FOLDER_NAME,
	LOCAL_STORAGE,
} from "./constants/keys";
import { wallpaper } from "./lib/wallpapers";

const URL_SCHEMA = z.url();

const getBookmarkTree = () =>
	new Promise<chrome.bookmarks.BookmarkTreeNode[]>((resolve, reject) => {
		chrome.bookmarks.getTree((bookmarkTree) => {
			const runtimeError = chrome.runtime.lastError;

			if (runtimeError) {
				reject(new Error(runtimeError.message));
				return;
			}

			resolve(bookmarkTree);
		});
	});

const getBookmarkById = (bookmarkId: string) =>
	new Promise<chrome.bookmarks.BookmarkTreeNode | undefined>((resolve) => {
		chrome.bookmarks.get(bookmarkId, (bookmarks) => {
			if (chrome.runtime.lastError) {
				resolve(undefined);
				return;
			}

			resolve(bookmarks[0]);
		});
	});

const findBookmarkFolder = (
	bookmarkTree: chrome.bookmarks.BookmarkTreeNode[],
	predicate: (node: chrome.bookmarks.BookmarkTreeNode) => boolean,
): chrome.bookmarks.BookmarkTreeNode | undefined => {
	for (const node of bookmarkTree) {
		if (
			node.url === undefined &&
			node.parentId !== undefined &&
			predicate(node)
		) {
			return node;
		}

		const nestedMatch = node.children
			? findBookmarkFolder(node.children, predicate)
			: undefined;

		if (nestedMatch) return nestedMatch;
	}

	return undefined;
};

const createBookmarkFolder = () =>
	new Promise<chrome.bookmarks.BookmarkTreeNode>((resolve, reject) => {
		chrome.bookmarks.create(
			{ title: DEFAULT_BOOKMARK_FOLDER_NAME },
			(bookmarkFolder) => {
				const runtimeError = chrome.runtime.lastError;

				if (runtimeError) {
					reject(new Error(runtimeError.message));
					return;
				}

				resolve(bookmarkFolder);
			},
		);
	});

let rootFolderCreationPromise:
	| Promise<chrome.bookmarks.BookmarkTreeNode>
	| undefined;

/** Validates the configured folder, reuses the default, or creates it once. */
const ensureRootBookmarkFolder = async (rootFolderId: string) => {
	if (rootFolderId) {
		const configuredFolder = await getBookmarkById(rootFolderId);
		if (configuredFolder && configuredFolder.url === undefined) {
			return configuredFolder.id;
		}
	}

	const bookmarkTree = await getBookmarkTree();

	const defaultFolder = findBookmarkFolder(
		bookmarkTree,
		(node) =>
			node.title === DEFAULT_BOOKMARK_FOLDER_NAME ||
			node.title === LEGACY_BOOKMARK_FOLDER_NAME,
	);

	if (defaultFolder) return defaultFolder.id;

	rootFolderCreationPromise ??= createBookmarkFolder().finally(() => {
		rootFolderCreationPromise = undefined;
	});

	return (await rootFolderCreationPromise).id;
};

/**
 * Handles background communication
 */
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
	switch (message.action) {
		case BACKGROUND_ACTIONS.ENSURE_ROOT_BOOKMARK_FOLDER:
			void ensureRootBookmarkFolder(
				typeof message.rootFolderId === "string" ? message.rootFolderId : "",
			).then(
				(folderId) => sendResponse({ folderId, ok: true }),
				(error: unknown) =>
					sendResponse({
						error: error instanceof Error ? error.message : String(error),
						ok: false,
					}),
			);

			return true;

		case BACKGROUND_ACTIONS.SEARCH_QUERY:
			{
				let { query, openIn } = message as {
					query: string;
					openIn: "new-tab" | "current-tab";
				};

				let { success: isValidUrl } = z.safeParse(URL_SCHEMA, query);

				// for example, google.com is a valid url
				if (
					!isValidUrl &&
					query
						.split(".")
						.map((part) => part.trim())
						.filter(Boolean).length >= 2
				) {
					isValidUrl = true;
					query = `https://${query}`;
				}

				if (isValidUrl) {
					if (openIn === "new-tab") {
						chrome.tabs.create({ url: query });
					} else {
						chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
							if (tabs.length > 0) {
								chrome.tabs.update(tabs[0].id, { url: query });
							}
						});
					}
				} else {
					chrome.search.query({
						text: query,
						disposition: openIn === "new-tab" ? "NEW_TAB" : "CURRENT_TAB",
					});
				}
			}

			return true;
	}
});

chrome.runtime.onInstalled.addListener((details) => {
	if (details.reason === "install") {
		chrome.tabs.create({ url: chrome.runtime.getURL("tabs/welcome.html") });

		// also save installed date
		chrome.storage.local.set({
			[LOCAL_STORAGE.installedDate]: new Date().toString(),
		});

		void wallpaper.fetchOnlineImages(true);
	}

	// Refresh remote choices periodically; displayed URLs use the browser cache.
	chrome.alarms.create(ALARMS.FETCH_ONLINE_IMAGES, { periodInMinutes: 60 * 3 });

	// Remove the obsolete base64-download job left by older installations.
	void chrome.alarms.clear("DOWNLOAD_PENDING_IMAGES");
});

// Handle alarm for periodic image fetching
chrome.alarms.onAlarm.addListener((alarm) => {
	switch (alarm.name) {
		case ALARMS.FETCH_ONLINE_IMAGES:
			void wallpaper.fetchOnlineImages();
			break;

		default:
			break;
	}
});

if (process.env.PLASMO_PUBLIC_UNINSTALL_URL) {
	chrome.runtime.setUninstallURL(process.env.PLASMO_PUBLIC_UNINSTALL_URL);
}
