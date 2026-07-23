const ACTIVE_ROOT_FOLDER_KEY = "activeRootFolder";

export const readActiveRootFolder = async (): Promise<string | undefined> => {
	const localResult = await chrome.storage.local.get(ACTIVE_ROOT_FOLDER_KEY);
	const localValue = localResult[ACTIVE_ROOT_FOLDER_KEY];
	if (typeof localValue === "string") return localValue;

	/* Migrate the old cross-device value once; bookmark IDs are profile-local. */
	const syncResult = await chrome.storage.sync.get(ACTIVE_ROOT_FOLDER_KEY);
	const value = syncResult[ACTIVE_ROOT_FOLDER_KEY];
	if (typeof value !== "string") return undefined;

	await chrome.storage.local.set({ [ACTIVE_ROOT_FOLDER_KEY]: value });
	await chrome.storage.sync.remove(ACTIVE_ROOT_FOLDER_KEY);

	return value;
};

export const writeActiveRootFolder = (folderId: string) =>
	chrome.storage.local.set({ [ACTIVE_ROOT_FOLDER_KEY]: folderId });
