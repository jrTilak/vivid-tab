export const BACKGROUND_ACTIONS = {
	ENSURE_ROOT_BOOKMARK_FOLDER: "ENSURE_ROOT_BOOKMARK_FOLDER",
	SEARCH_QUERY: "SEARCH_QUERY",
	TOGGLE_VIVID_SEARCH: "TOGGLE_VIVID_SEARCH",
} as const;

export const EXTENSION_COMMANDS = {
	TOGGLE_VIVID_SEARCH: "toggle-vivid-search",
} as const;

export type ToggleVividSearchMessage = {
	action: typeof BACKGROUND_ACTIONS.TOGGLE_VIVID_SEARCH;
	targetTabId: number;
};

/** Narrows the internal command message delivered by the extension runtime. */
export const isToggleVividSearchMessage = (
	message: unknown,
): message is ToggleVividSearchMessage =>
	message !== null &&
	typeof message === "object" &&
	"action" in message &&
	message.action === BACKGROUND_ACTIONS.TOGGLE_VIVID_SEARCH &&
	"targetTabId" in message &&
	typeof message.targetTabId === "number";

export const ALARMS = {
	FETCH_ONLINE_IMAGES: "FETCH_ONLINE_IMAGES",
};
