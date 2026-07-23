import { DEFAULT_SEARCH_TERMS } from "./wallpapers";

/**
 * Increment when the persisted shape changes incompatibly and add a migration
 * before releasing that version.
 */
export const SETTINGS_VERSION = 1 as const;

/** Largest completed-todo retention period accepted by settings storage. */
export const MAX_TODO_EXPIRATION_MINUTES = 525_600;

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
			searchSuggestions: false,
		},
	},
	appearance: {
		radius: "none",
		theme: "dark",
		visualEffect: "translucent",
		wallpapers: {
			selectedImageId: null,
			images: [] as string[],
			bookmarkedImageIds: [] as string[],
			onlineImages: {
				enabled: false,
				keywords: DEFAULT_SEARCH_TERMS.join(", "),
			},
		},
		background: {
			blurIntensity: 5,
			brightness: 9,
			randomizeWallpaper: "off",
		},
	},
} as const;
