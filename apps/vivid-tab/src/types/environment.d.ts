declare namespace NodeJS {
	interface ProcessEnv {
		readonly PLASMO_PUBLIC_BROWSER_NAME?: "chrome" | "firefox";
		readonly PLASMO_PUBLIC_WEATHER_API_KEY?: string;
		readonly PLASMO_PUBLIC_UNINSTALL_URL?: string;
		readonly PLASMO_PUBLIC_UPDATE_URL?: string;
		readonly PLASMO_PUBLIC_FEEDBACK_URL?: string;
		readonly PLASMO_PUBLIC_CHROME_WEBSTORE_URL?: string;
		readonly PLASMO_PUBLIC_FIREFOX_ADDON_URL?: string;
		readonly PLASMO_PUBLIC_DEV_RADIUS?: "rounded" | "none" | "sm";
		readonly PLASMO_PUBLIC_DEV_VISUAL_EFFECT?: "opaque" | "translucent";
		readonly PLASMO_PUBLIC_DEV_THEME?: "dark" | "light" | "system";
	}
}
