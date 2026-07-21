import type { Theme } from "@/lib/theme";
import type { Settings } from "@/zod/settings";

type General = Settings["general"];
type Appearance = Settings["appearance"];
type Background = Appearance["background"];
type Searchbar = Settings["widgets"]["searchbar"];
type Temperature = Settings["widgets"]["temperature"];
type Timer = Settings["widgets"]["timer"];

export const THEME_OPTIONS = [
	{ label: "Dark", value: "dark" },
	{ label: "Catppuccin Mocha", value: "catppuccin-mocha" },
	{ label: "Tokyo Night", value: "tokyo-night" },
] as const satisfies ReadonlyArray<{ label: string; value: Theme }>;

export const RADIUS_OPTIONS = [
	{ label: "Rounded", value: "rounded" },
	{ label: "Small", value: "sm" },
	{ label: "None", value: "none" },
] as const satisfies ReadonlyArray<{
	label: string;
	value: Appearance["radius"];
}>;

export const VISUAL_EFFECT_OPTIONS = [
	{ label: "Translucent", value: "translucent" },
	{ label: "Opaque", value: "opaque" },
] as const satisfies ReadonlyArray<{
	label: string;
	value: Appearance["visualEffect"];
}>;

export const BOOKMARK_LAYOUT_OPTIONS = [
	{ label: "Grid", value: "grid" },
	{ label: "List", value: "list" },
] as const satisfies ReadonlyArray<{
	label: string;
	value: General["layout"];
}>;

export const OPEN_URL_OPTIONS = [
	{ label: "New tab", value: "new-tab" },
	{ label: "Current tab", value: "current-tab" },
] as const satisfies ReadonlyArray<{
	label: string;
	value: General["openUrlIn"];
}>;

export const RANDOMIZE_WALLPAPER_OPTIONS = [
	{ label: "Off", value: "off" },
	{ label: "On each tab", value: "on-each-tab" },
	{ label: "Hourly", value: "hourly" },
	{ label: "Daily", value: "daily" },
] as const satisfies ReadonlyArray<{
	label: string;
	value: Background["randomizeWallpaper"];
}>;

export const SEARCH_ACTION_OPTIONS = [
	{ label: "Default search engine", value: "default" },
	{ label: "Ask ChatGPT", value: "ask-chatgpt" },
	{ label: "Ask Claude", value: "ask-claude" },
	{ label: "Search on YouTube", value: "search-on-youtube" },
	{ label: "Search online", value: "search-online" },
] as const satisfies ReadonlyArray<{
	label: string;
	value: Searchbar["submitDefaultAction"];
}>;

export const TIME_FORMAT_OPTIONS = [
	{ label: "12-hour", value: "12h" },
	{ label: "24-hour", value: "24h" },
] as const satisfies ReadonlyArray<{
	label: string;
	value: Timer["timeFormat"];
}>;

export const TEMPERATURE_UNIT_OPTIONS = [
	{ label: "Celsius", value: "celsius" },
	{ label: "Fahrenheit", value: "fahrenheit" },
] as const satisfies ReadonlyArray<{
	label: string;
	value: Temperature["unit"];
}>;
