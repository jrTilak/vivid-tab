import {
	BOOKMARK_ICON_STORAGE_PREFIX,
	BOOKMARK_ICON_UPDATE_EVENT,
	getBookmarkIconStorageKey,
	parseStoredBookmarkIcon,
} from "./bookmark-icons";

type IconListener = () => void;
const iconCache = new Map<string, string | null>();
const listeners = new Map<string, Set<IconListener>>();
const queuedIds = new Set<string>();
const queuedResolvers = new Map<string, Set<() => void>>();

let isBatchScheduled = false;
let subscriberCount = 0;

const notifyIconListeners = (id: string) => {
	for (const listener of listeners.get(id) ?? []) listener();
};

const updateCachedIcon = (id: string, value: unknown) => {
	const icon = parseStoredBookmarkIcon(value);
	const hadCachedValue = iconCache.has(id);
	const previousIcon = iconCache.get(id);

	iconCache.set(id, icon);
	if (!hadCachedValue || previousIcon !== icon) notifyIconListeners(id);
};

const flushIconReads = async () => {
	const ids = [...queuedIds];
	const completions = new Map<string, Set<() => void>>();
	for (const id of ids) {
		completions.set(id, queuedResolvers.get(id) ?? new Set());
		queuedResolvers.delete(id);
	}
	queuedIds.clear();
	isBatchScheduled = false;

	try {
		const keys = ids.map(getBookmarkIconStorageKey);
		const storedIcons = await chrome.storage.local.get(keys);

		for (const id of ids) {
			updateCachedIcon(id, storedIcons[getBookmarkIconStorageKey(id)]);
		}
	} catch (error) {
		console.error("Failed to load bookmark icons:", error);
		for (const id of ids) updateCachedIcon(id, null);
	} finally {
		for (const id of ids) {
			for (const resolve of completions.get(id) ?? []) resolve();
		}
	}
};

/** Coalesces all icon reads from the same render into one storage request. */
const refreshBookmarkIcon = (id: string): Promise<void> => {
	queuedIds.add(id);

	const completion = new Promise<void>((resolve) => {
		const resolvers = queuedResolvers.get(id) ?? new Set();
		resolvers.add(resolve);
		queuedResolvers.set(id, resolvers);
	});

	if (!isBatchScheduled) {
		isBatchScheduled = true;
		queueMicrotask(() => void flushIconReads());
	}

	return completion;
};

const handleBookmarkIconEvent = (event: Event) => {
	const id = (event as CustomEvent<{ id?: unknown }>).detail?.id;
	if (typeof id === "string") void refreshBookmarkIcon(id);
};

const handleIconStorageChange = (
	changes: Record<string, chrome.storage.StorageChange>,
	areaName: string,
) => {
	if (areaName !== "local") return;

	for (const [key, change] of Object.entries(changes)) {
		if (!key.startsWith(BOOKMARK_ICON_STORAGE_PREFIX)) continue;

		updateCachedIcon(
			key.slice(BOOKMARK_ICON_STORAGE_PREFIX.length),
			change.newValue,
		);
	}
};

const attachGlobalListeners = () => {
	if (subscriberCount++ > 0) return;

	window.addEventListener(BOOKMARK_ICON_UPDATE_EVENT, handleBookmarkIconEvent);
	chrome.storage.onChanged.addListener(handleIconStorageChange);
};

const detachGlobalListeners = () => {
	subscriberCount -= 1;
	if (subscriberCount > 0) return;

	subscriberCount = 0;
	window.removeEventListener(
		BOOKMARK_ICON_UPDATE_EVENT,
		handleBookmarkIconEvent,
	);
	chrome.storage.onChanged.removeListener(handleIconStorageChange);
};

const subscribeBookmarkIcon = (
	id: string | undefined,
	listener: IconListener,
): (() => void) => {
	if (!id) return () => undefined;

	const iconListeners = listeners.get(id) ?? new Set();
	iconListeners.add(listener);
	listeners.set(id, iconListeners);
	attachGlobalListeners();

	if (!iconCache.has(id)) void refreshBookmarkIcon(id);

	return () => {
		const currentListeners = listeners.get(id);
		currentListeners?.delete(listener);
		if (currentListeners?.size === 0) listeners.delete(id);
		detachGlobalListeners();
	};
};

const getBookmarkIconSnapshot = (
	id: string | undefined,
	defaultIcon?: string,
): string | null => {
	if (!id || !iconCache.has(id)) return defaultIcon || null;

	return iconCache.get(id) ?? defaultIcon ?? null;
};

export { getBookmarkIconSnapshot, refreshBookmarkIcon, subscribeBookmarkIcon };
