import {
	ALARMS,
	BACKGROUND_ACTIONS,
	EXTENSION_COMMANDS,
	type ToggleVividSearchMessage,
} from "@/constants/background-actions";
import { LOCAL_STORAGE } from "@/constants/keys";
import { resolveBookmarkRootFolder } from "@/lib/bookmarks";
import { resolveSearchTarget } from "@/lib/search-query";
import { migrateV13SettingsOnUpgrade } from "@/lib/settings-storage";
import { wallpaper } from "@/lib/wallpapers/service";

const WELCOME_PAGE_PATH = "tabs/welcome.html";
const ONLINE_WALLPAPER_REFRESH_MINUTES = 180;
const SHOULD_OPEN_LIFECYCLE_PAGES = process.env.NODE_ENV !== "development";

/**
 * @deprecated Kept for one final cleanup cycle and planned for removal in the
 * next release.
 */
const LEGACY_DOWNLOAD_ALARM = "DOWNLOAD_PENDING_IMAGES";

/* Only the bookmark request needs to keep Chrome's response channel open. */
chrome.runtime.onMessage.addListener((message: unknown, _, sendResponse) => {
	if (
		message === null ||
		typeof message !== "object" ||
		!("action" in message)
	) {
		return undefined;
	}

	switch (message.action) {
		case BACKGROUND_ACTIONS.ENSURE_ROOT_BOOKMARK_FOLDER: {
			const rootFolderId =
				"rootFolderId" in message && typeof message.rootFolderId === "string"
					? message.rootFolderId
					: "";

			void resolveBookmarkRootFolder(rootFolderId).then(
				(folderId) => sendResponse({ folderId, ok: true }),
				(error: unknown) =>
					sendResponse({
						error: error instanceof Error ? error.message : String(error),
						ok: false,
					}),
			);

			return true;
		}

		case BACKGROUND_ACTIONS.SEARCH_QUERY: {
			const openIn = "openIn" in message ? message.openIn : undefined;
			if (openIn !== "current-tab" && openIn !== "new-tab") return undefined;

			const query = "query" in message ? message.query : undefined;
			const target = resolveSearchTarget(query);

			if (target.kind === "search") {
				void chrome.search.query({
					disposition: openIn === "new-tab" ? "NEW_TAB" : "CURRENT_TAB",
					text: target.query,
				});
				return undefined;
			}

			if (openIn === "new-tab") {
				void chrome.tabs.create({ url: target.url });
				return undefined;
			}

			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				const activeTabId = tabs[0]?.id;
				if (typeof activeTabId === "number") {
					void chrome.tabs.update(activeTabId, { url: target.url });
				}
			});

			return undefined;
		}

		default:
			return undefined;
	}
});

const sendSearchToggleToTab = (tab: chrome.tabs.Tab | undefined) => {
	const tabId = tab?.id;
	if (typeof tabId !== "number") return;

	const message: ToggleVividSearchMessage = {
		action: BACKGROUND_ACTIONS.TOGGLE_VIVID_SEARCH,
		targetTabId: tabId,
	};

	try {
		void chrome.runtime.sendMessage(message).catch(() => undefined);
	} catch {
		/* Extension views may be navigating or already closed. */
	}
};

chrome.commands.onCommand.addListener((command, tab) => {
	if (command !== EXTENSION_COMMANDS.TOGGLE_VIVID_SEARCH) return;

	if (typeof tab?.id === "number") {
		sendSearchToggleToTab(tab);
		return;
	}

	try {
		chrome.tabs.query({ active: true, currentWindow: true }, ([activeTab]) => {
			sendSearchToggleToTab(activeTab);
		});
	} catch {
		/* Browser-owned pages may provide neither a tab nor query access. */
	}
});

chrome.runtime.onInstalled.addListener((details) => {
	switch (details.reason) {
		case "install":
			if (SHOULD_OPEN_LIFECYCLE_PAGES) {
				void chrome.tabs.create({
					url: chrome.runtime.getURL(WELCOME_PAGE_PATH),
				});
			}
			void chrome.storage.local.set({
				[LOCAL_STORAGE.installedDate]: new Date().toString(),
			});
			void wallpaper.fetchOnlineImages(true);
			break;

		case "update": {
			void migrateV13SettingsOnUpgrade(
				details.previousVersion,
				chrome.runtime.getManifest().version,
			)
				.catch((error) => {
					console.error("Failed to migrate v1.3 settings:", error);
				})
				.then(() => {
					if (!SHOULD_OPEN_LIFECYCLE_PAGES) return;

					const updateUrl = process.env.PLASMO_PUBLIC_UPDATE_URL?.trim();
					if (updateUrl) void chrome.tabs.create({ url: updateUrl });
				});
			break;
		}

		default:
			break;
	}

	chrome.alarms.create(ALARMS.FETCH_ONLINE_IMAGES, {
		periodInMinutes: ONLINE_WALLPAPER_REFRESH_MINUTES,
	});

	/**
	 * @deprecated Older releases stored downloaded wallpapers as base64. Remove
	 * this alarm cleanup in v1.5.0 after the v1.4.0 upgrade window.
	 */
	void chrome.alarms.clear(LEGACY_DOWNLOAD_ALARM);
});

chrome.alarms.onAlarm.addListener((alarm) => {
	switch (alarm.name) {
		case ALARMS.FETCH_ONLINE_IMAGES:
			void wallpaper.fetchOnlineImages();
			break;

		default:
			break;
	}
});

if (SHOULD_OPEN_LIFECYCLE_PAGES) {
	const uninstallUrl = process.env.PLASMO_PUBLIC_UNINSTALL_URL?.trim();
	if (uninstallUrl) void chrome.runtime.setUninstallURL(uninstallUrl);
}
