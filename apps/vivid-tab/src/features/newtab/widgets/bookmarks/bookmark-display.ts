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

/** Uses the conventional favicon location without downloading the full page. */
export const getBookmarkFaviconUrl = (url: string): string | undefined => {
	try {
		const parsed = new URL(url);
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
			return undefined;
		}

		return new URL("/favicon.ico", parsed.origin).href;
	} catch {
		return undefined;
	}
};
