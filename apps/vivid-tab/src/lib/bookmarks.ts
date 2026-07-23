import { BACKGROUND_ACTIONS } from "@/constants/background-actions";
import { DEFAULT_BOOKMARK_FOLDER_NAME } from "@/constants/keys";
import type { BookmarkFolderNode, Bookmarks } from "@/types/bookmark";

type BookmarkNode = chrome.bookmarks.BookmarkTreeNode;
type IconListener = () => void;

/**
 * Previous default bookmark-folder title retained for upgrade discovery.
 *
 * @deprecated Remove in v1.5.0 after v1.4.0 installations have migrated.
 */
const LEGACY_BOOKMARK_FOLDER_NAME = "vivid-tab-bookmarks";

/**
 * DOM event dispatched when a bookmark editor changes a persisted custom icon.
 */
export const BOOKMARK_ICON_UPDATE_EVENT = "bookmarks:update";

/**
 * Prefix that separates custom bookmark icons from unrelated local storage.
 */
export const BOOKMARK_ICON_STORAGE_PREFIX = "icon-";

/**
 * Identifies the bookmark whose custom icon changed in extension storage.
 */
interface BookmarkIconUpdateDetail {
	id: string;
}

/**
 * Browser operations required to locate or create Vivid Tab's bookmark root.
 * Keeping these injectable makes the concurrency rules testable without Chrome.
 */
export interface BookmarkRootOperations {
	createFolder: () => Promise<BookmarkNode>;
	getFolderById: (folderId: string) => Promise<BookmarkNode | undefined>;
	getTree: () => Promise<BookmarkNode[]>;
}

/**
 * Selectable bookmark folder metadata, including its nesting depth for display.
 */
export interface FlattenedBookmarkFolder {
	id: string;
	title: string;
	depth: number;
}

type EnsureRootBookmarkFolderResponse =
	| { folderId: string; ok: true }
	| { error: string; ok: false };

const getRuntimeError = (): Error | undefined => {
	const error = chrome.runtime.lastError;

	return error ? new Error(error.message) : undefined;
};

const getBookmarkTree = (): Promise<BookmarkNode[]> =>
	new Promise((resolve, reject) => {
		chrome.bookmarks.getTree((nodes) => {
			const error = getRuntimeError();
			error ? reject(error) : resolve(nodes);
		});
	});

const getBookmarkSubTree = (id: string): Promise<BookmarkNode[]> =>
	new Promise((resolve, reject) => {
		chrome.bookmarks.getSubTree(id, (nodes) => {
			const error = getRuntimeError();
			error ? reject(error) : resolve(nodes);
		});
	});

const getBookmarkById = (
	bookmarkId: string,
): Promise<BookmarkNode | undefined> =>
	new Promise((resolve) => {
		chrome.bookmarks.get(bookmarkId, (bookmarks) => {
			/* Chrome reports a deleted or unknown ID through runtime.lastError. */
			resolve(chrome.runtime.lastError ? undefined : bookmarks[0]);
		});
	});

const createDefaultBookmarkFolder = (): Promise<BookmarkNode> =>
	new Promise((resolve, reject) => {
		chrome.bookmarks.create(
			{ title: DEFAULT_BOOKMARK_FOLDER_NAME },
			(bookmarkFolder) => {
				const error = getRuntimeError();
				error ? reject(error) : resolve(bookmarkFolder);
			},
		);
	});

/**
 * Removes the synthetic root returned by Chrome's tree and subtree methods.
 * A node without `children` is retained so malformed or URL subtree responses
 * remain visible to callers instead of being silently discarded.
 *
 * @param nodes - Raw array returned by a Chrome bookmarks callback.
 * @returns The useful children, or the original array when it has no wrapper.
 */
export const getBookmarkChildren = (nodes: BookmarkNode[]): Bookmarks => {
	const root = nodes[0];
	if (!root) return [];

	/* getTree/getSubTree wrap their useful results in one browser root node. */
	return (root.children ?? nodes) as Bookmarks;
};

/**
 * Reads bookmarks from either the configured folder or the browser-wide tree.
 * Chrome callback errors are converted to rejected promises at this boundary.
 *
 * @param rootFolderId - Optional folder whose direct children should be returned.
 * @returns The root folder's children in browser display order.
 */
export const readBookmarks = async (
	rootFolderId?: string,
): Promise<Bookmarks> => {
	const nodes = rootFolderId
		? await getBookmarkSubTree(rootFolderId)
		: await getBookmarkTree();

	return getBookmarkChildren(nodes);
};

/**
 * Finds the first selectable nested folder that satisfies a predicate.
 * Synthetic browser roots and URL bookmarks are deliberately skipped.
 *
 * @param tree - Raw bookmark tree to search depth-first.
 * @param predicate - Domain condition applied only to selectable folders.
 * @returns The first matching folder in display order, if one exists.
 */
export const findBookmarkFolder = (
	tree: readonly BookmarkNode[],
	predicate: (node: BookmarkNode) => boolean,
): BookmarkNode | undefined => {
	for (const node of tree) {
		/* Browser roots and URL bookmarks must never become a selectable folder. */
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

/**
 * Creates a root-folder resolver that validates saved IDs, reuses folders from
 * current and legacy releases, and coalesces concurrent creation requests.
 * A rejected creation is cleared so a later request can retry safely.
 *
 * @example
 * ```ts
 * const resolveRoot = createBookmarkRootResolver(browserOperations);
 * const [first, second] = await Promise.all([resolveRoot(""), resolveRoot("")]);
 * // Both IDs are equal and browserOperations.createFolder ran only once.
 * ```
 *
 * @param operations - Promise-based bookmark operations for the active profile.
 * @returns A stable resolver for the lifetime of the background context.
 */
export const createBookmarkRootResolver = ({
	createFolder,
	getFolderById,
	getTree,
}: BookmarkRootOperations) => {
	let creationPromise: Promise<BookmarkNode> | undefined;

	return async (configuredFolderId: string): Promise<string> => {
		if (configuredFolderId) {
			const configuredFolder = await getFolderById(configuredFolderId);

			if (configuredFolder && configuredFolder.url === undefined) {
				return configuredFolder.id;
			}
		}

		const tree = await getTree();
		const existingFolder = findBookmarkFolder(
			tree,
			(node) =>
				node.title === DEFAULT_BOOKMARK_FOLDER_NAME ||
				node.title === LEGACY_BOOKMARK_FOLDER_NAME,
		);

		if (existingFolder) return existingFolder.id;

		creationPromise ??= createFolder().finally(() => {
			creationPromise = undefined;
		});

		return (await creationPromise).id;
	};
};

/**
 * Resolves the extension's bookmark root using the active Chrome profile.
 * The module-scoped resolver prevents separate messages from creating duplicates.
 */
export const resolveBookmarkRootFolder = createBookmarkRootResolver({
	createFolder: createDefaultBookmarkFolder,
	getFolderById: getBookmarkById,
	getTree: getBookmarkTree,
});

/**
 * Requests root-folder validation from the background context, where creation
 * is serialized across every open new-tab page.
 *
 * @param rootFolderId - The currently persisted folder ID, or an empty string.
 * @returns The validated existing folder ID or a newly created folder ID.
 */
export const ensureRootBookmarkFolder = (
	rootFolderId: string,
): Promise<string> =>
	new Promise((resolve, reject) => {
		chrome.runtime.sendMessage(
			{
				action: BACKGROUND_ACTIONS.ENSURE_ROOT_BOOKMARK_FOLDER,
				rootFolderId,
			},
			(response: EnsureRootBookmarkFolderResponse | undefined) => {
				const runtimeError = chrome.runtime.lastError;

				if (runtimeError) {
					reject(new Error(runtimeError.message));
					return;
				}

				if (
					response?.ok === true &&
					typeof response.folderId === "string" &&
					response.folderId.length > 0
				) {
					resolve(response.folderId);
					return;
				}

				if (
					response?.ok === false &&
					typeof response.error === "string" &&
					response.error.length > 0
				) {
					reject(new Error(response.error));
					return;
				}

				reject(new Error("Unable to resolve bookmark folder"));
			},
		);
	});

const isBookmarkFolder = (
	bookmark: Bookmarks[number],
): bookmark is BookmarkFolderNode => bookmark.url === undefined;

/**
 * Flattens nested bookmark folders in display order while preserving depth.
 * URL bookmarks are ignored because only folders can be selected as a root.
 * The optional accumulator avoids allocating an array at every recursion level.
 *
 * @example
 * ```ts
 * flattenBookmarkFolders(bookmarks);
 * // [{ id: "work", title: "Work", depth: 0 }, ...]
 * ```
 *
 * @param bookmarks - A bookmark subtree from the browser API.
 * @param depth - Current recursive depth; callers normally omit it.
 * @param output - Shared recursive accumulator; callers normally omit it.
 * @returns Folder metadata in the same order shown by the browser.
 */
export const flattenBookmarkFolders = (
	bookmarks: Bookmarks,
	depth = 0,
	output: FlattenedBookmarkFolder[] = [],
): FlattenedBookmarkFolder[] => {
	for (const bookmark of bookmarks) {
		if (!isBookmarkFolder(bookmark)) continue;

		output.push({
			id: bookmark.id,
			title: bookmark.title,
			depth,
		});

		if (bookmark.children?.length) {
			flattenBookmarkFolders(bookmark.children, depth + 1, output);
		}
	}

	return output;
};

const iconCache = new Map<string, string | null>();
const iconListeners = new Map<string, Set<IconListener>>();
const queuedIconIds = new Set<string>();
const queuedIconResolvers = new Map<string, Set<() => void>>();
const queuedIconSubscriptions = new Map<
	string,
	Set<IconListener> | undefined
>();

let isIconBatchScheduled = false;
let iconSubscriberCount = 0;

/**
 * Produces the storage key used for one bookmark or folder's custom icon.
 *
 * @param bookmarkId - Chrome bookmark ID.
 * @returns A key namespaced away from other extension storage.
 */
export const getBookmarkIconStorageKey = (bookmarkId: string) =>
	`${BOOKMARK_ICON_STORAGE_PREFIX}${bookmarkId}`;

/**
 * Extracts an icon URL from untrusted extension storage.
 * Empty strings and malformed records are treated as missing icons.
 *
 * @param storedValue - Raw value returned by `chrome.storage`.
 * @returns A usable URL/data URI, or `null` when no icon is available.
 */
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

/**
 * Notifies mounted bookmark icons after an editor commits a storage change.
 * Storage events do not fire in the same context that performed the write.
 *
 * @param bookmarkId - ID whose cached icon should be refreshed.
 */
export const notifyBookmarkIconChanged = (bookmarkId: string): void => {
	window.dispatchEvent(
		new CustomEvent<BookmarkIconUpdateDetail>(BOOKMARK_ICON_UPDATE_EVENT, {
			detail: { id: bookmarkId },
		}),
	);
};

const notifyIconListeners = (id: string): void => {
	for (const listener of iconListeners.get(id) ?? []) listener();
};

const updateCachedIcon = (id: string, value: unknown): void => {
	const icon = parseStoredBookmarkIcon(value);
	const hadCachedValue = iconCache.has(id);
	const previousIcon = iconCache.get(id);

	iconCache.set(id, icon);
	if (!hadCachedValue || previousIcon !== icon) notifyIconListeners(id);
};

const flushIconReads = async (): Promise<void> => {
	const ids = [...queuedIconIds];
	const completions = new Map<string, Set<() => void>>();
	const subscriptions = new Map<string, Set<IconListener> | undefined>();

	for (const id of ids) {
		completions.set(id, queuedIconResolvers.get(id) as Set<() => void>);
		subscriptions.set(id, queuedIconSubscriptions.get(id));
		queuedIconResolvers.delete(id);
		queuedIconSubscriptions.delete(id);
	}

	queuedIconIds.clear();
	isIconBatchScheduled = false;

	try {
		const keys = ids.map(getBookmarkIconStorageKey);
		const storedIcons = await chrome.storage.local.get(keys);

		for (const id of ids) {
			/* A different subscription now owns this ID, so this read is stale. */
			if (subscriptions.get(id) !== iconListeners.get(id)) continue;
			updateCachedIcon(id, storedIcons[getBookmarkIconStorageKey(id)]);
		}
	} catch (error) {
		console.error("Failed to load bookmark icons:", error);
		for (const id of ids) {
			if (subscriptions.get(id) === iconListeners.get(id)) {
				updateCachedIcon(id, null);
			}
		}
	} finally {
		for (const id of ids) {
			for (const resolve of completions.get(id) as Set<() => void>) resolve();
		}
	}
};

/**
 * Queues an icon read. Calls made in the same microtask share one storage query,
 * which avoids one extension-storage round trip per rendered bookmark.
 *
 * @param id - Bookmark or folder ID to refresh.
 * @returns A promise settled after that ID's current batch has completed.
 */
export const refreshBookmarkIcon = (id: string): Promise<void> => {
	queuedIconIds.add(id);
	queuedIconSubscriptions.set(id, iconListeners.get(id));

	const completion = new Promise<void>((resolve) => {
		const resolvers = queuedIconResolvers.get(id) ?? new Set();
		resolvers.add(resolve);
		queuedIconResolvers.set(id, resolvers);
	});

	if (!isIconBatchScheduled) {
		isIconBatchScheduled = true;
		queueMicrotask(() => void flushIconReads());
	}

	return completion;
};

const handleBookmarkIconEvent = (event: Event): void => {
	const id = (event as CustomEvent<{ id?: unknown }>).detail?.id;
	if (typeof id === "string" && iconListeners.has(id)) {
		void refreshBookmarkIcon(id);
	}
};

const handleIconStorageChange = (
	changes: Record<string, chrome.storage.StorageChange>,
	areaName: string,
): void => {
	if (areaName !== "local") return;

	for (const [key, change] of Object.entries(changes)) {
		if (!key.startsWith(BOOKMARK_ICON_STORAGE_PREFIX)) continue;

		const id = key.slice(BOOKMARK_ICON_STORAGE_PREFIX.length);
		if (iconListeners.has(id)) updateCachedIcon(id, change.newValue);
	}
};

const attachGlobalIconListeners = (): void => {
	if (iconSubscriberCount++ > 0) return;

	window.addEventListener(BOOKMARK_ICON_UPDATE_EVENT, handleBookmarkIconEvent);
	chrome.storage.onChanged.addListener(handleIconStorageChange);
};

const detachGlobalIconListeners = (): void => {
	iconSubscriberCount -= 1;
	if (iconSubscriberCount > 0) return;

	iconSubscriberCount = 0;
	iconCache.clear();
	window.removeEventListener(
		BOOKMARK_ICON_UPDATE_EVENT,
		handleBookmarkIconEvent,
	);
	chrome.storage.onChanged.removeListener(handleIconStorageChange);
};

/**
 * Subscribes one React external-store listener to a bookmark icon.
 * The first global subscriber installs browser listeners and the last removes
 * them, so closed widgets retain no icon cache or storage listener.
 *
 * @example
 * ```ts
 * const unsubscribe = subscribeBookmarkIcon(id, onStoreChange);
 * const icon = getBookmarkIconSnapshot(id, fallback);
 * unsubscribe();
 * ```
 *
 * @param id - Bookmark ID, or `undefined` while no bookmark is selected.
 * @param listener - Callback used by `useSyncExternalStore`.
 * @returns An idempotent cleanup function.
 */
export const subscribeBookmarkIcon = (
	id: string | undefined,
	listener: IconListener,
): (() => void) => {
	if (!id) return () => undefined;

	const listeners = iconListeners.get(id) ?? new Set();
	listeners.add(listener);
	iconListeners.set(id, listeners);
	attachGlobalIconListeners();

	/* A remounted icon may have changed while this page had no subscribers. */
	void refreshBookmarkIcon(id);
	let isSubscribed = true;

	return () => {
		if (!isSubscribed) return;
		isSubscribed = false;

		const currentListeners = iconListeners.get(id);
		currentListeners?.delete(listener);
		if (currentListeners?.size === 0) {
			iconListeners.delete(id);
			iconCache.delete(id);
		}
		detachGlobalIconListeners();
	};
};

/**
 * Reads the synchronous snapshot required by `useSyncExternalStore`.
 * A fallback is returned until the first batched storage read completes.
 *
 * @param id - Bookmark ID whose icon should be read.
 * @param defaultIcon - Optional image shown for missing or invalid icons.
 * @returns The cached custom icon, fallback, or `null`.
 */
export const getBookmarkIconSnapshot = (
	id: string | undefined,
	defaultIcon?: string,
): string | null => {
	if (!id || !iconCache.has(id)) return defaultIcon || null;

	return iconCache.get(id) ?? defaultIcon ?? null;
};
