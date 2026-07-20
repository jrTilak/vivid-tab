import { DEFAULT_WALLHAVEN_KEYWORDS } from "./wallpapers";

/**
 * Increment when the persisted shape changes incompatibly and add a migration
 * before releasing that version.
 */
export const SETTINGS_VERSION = 1 as const;

export const DEFAULT_SETTINGS = {
	version: SETTINGS_VERSION,
	general: {
		/* Resolved to a profile-local bookmark folder before the new tab renders. */
		rootFolder: "",
		showHistory: false,
		layout: "grid",
		openUrlIn: "current-tab",
		bookmarksCanTakeExtraSpaceIfAvailable: true,
		showTopSites: false,
	},
	widgets: {
		timer: {
			timeFormat: "12h",
			showSeconds: false,
		},
		temperature: {
			unit: "celsius",
		},
		quotes: {
			categories: [] as string[],
		},
		todos: {
			expireAfterCompleted: {
				enabled: true,
				durationInMinutes: 60, // 1 hour
			},
		},
		layout: {
			0: "searchbar",
			1: "clock",
			2: "weather",
			3: "todos",
			4: "bookmarks",
			5: "quotes",
			6: "notes",
		},
		searchbar: {
			dialogBackground: "default",
			shortcuts: ["chatgpt", "claude", "youtube", "search-online"],
			submitDefaultAction: "default",
			searchSuggestions: false,
		},
	},
	appearance: {
		radius: "rounded",
		visualEffect: "translucent",
		wallpapers: {
			selectedImageId: null,
			images: [] as string[],
			onlineImages: {
				enabled: true,
				keywords: DEFAULT_WALLHAVEN_KEYWORDS,
			},
		},
		background: {
			blurIntensity: 5,
			brightness: 9,
			randomizeWallpaper: "on-each-tab",
		},
	},
} as const;
