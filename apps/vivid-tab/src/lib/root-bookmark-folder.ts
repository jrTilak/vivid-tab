import { BACKGROUND_ACTIONS } from "@/constants/background-actions";

type EnsureRootBookmarkFolderResponse =
	| { folderId: string; ok: true }
	| { error: string; ok: false };

/**
 * Asks the extension background context to validate or create the root folder.
 * Creation is centralized there so concurrent new-tab pages cannot create
 * duplicate Vivid Tab folders.
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

				if (!response) {
					reject(new Error("Unable to resolve bookmark folder"));
					return;
				}

				if ("error" in response) {
					reject(new Error(response.error));
					return;
				}

				resolve(response.folderId);
			},
		);
	});
