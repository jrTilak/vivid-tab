/** Returns at most two readable initials for an icon fallback. */
export const getBookmarkInitials = (title: string) =>
	title
		.replace(/[^a-zA-Z ]/g, "")
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.map((word) => word[0]?.toUpperCase())
		.join("")
		.slice(0, 2);

/**
 * Returns favicon candidates without downloading and parsing the bookmarked page.
 *
 * Chromium exposes the favicon it selected through its extension favicon cache.
 * Firefox does not expose an equivalent API, so it tries the conventional
 * high-resolution touch icon before falling back to the site's favicon.
 */
export const getBookmarkFaviconSources = (
	url: string,
	browserName = process.env.PLASMO_PUBLIC_BROWSER_NAME,
): string[] => {
	try {
		const parsed = new URL(url);
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
			return [];
		}

		if (browserName === "firefox") {
			return [
				new URL("/apple-touch-icon.png", parsed.origin).href,
				new URL("/favicon.ico", parsed.origin).href,
			];
		}

		const faviconUrl = new URL(chrome.runtime.getURL("/_favicon/"));
		faviconUrl.searchParams.set("pageUrl", parsed.href);
		faviconUrl.searchParams.set("size", "64");

		return [faviconUrl.href];
	} catch {
		return [];
	}
};
