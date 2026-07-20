import { useCallback, useEffect, useRef, useState } from "react";
import { readBookmarks } from "@/lib/bookmark-reader";
import type { Bookmarks } from "@/types/bookmark";

const BOOKMARK_REFRESH_DELAY_MS = 25;

/**
 * Custom hook to fetch bookmarks from the Chrome extension's bookmarks API.
 * If id is provided, it returns the bookmarks of the given id,
 */
const useBookmarks = (id?: string) => {
	const [bookmarks, setBookmarks] = useState<Bookmarks>([]);

	const requestRevisionRef = useRef(0);

	const refreshBookmarks = useCallback(async () => {
		const requestRevision = ++requestRevisionRef.current;

		try {
			const nextBookmarks = await readBookmarks(id);
			if (requestRevision === requestRevisionRef.current) {
				setBookmarks(nextBookmarks);
			}
		} catch (error) {
			if (requestRevision === requestRevisionRef.current) {
				console.error("Failed to read bookmarks:", error);
				setBookmarks([]);
			}
		}
	}, [id]);

	useEffect(() => {
		let refreshTimeout: ReturnType<typeof setTimeout> | undefined;
		const scheduleRefresh = () => {
			if (refreshTimeout) clearTimeout(refreshTimeout);
			refreshTimeout = setTimeout(
				() => void refreshBookmarks(),
				BOOKMARK_REFRESH_DELAY_MS,
			);
		};

		void refreshBookmarks();
		chrome.bookmarks.onCreated.addListener(scheduleRefresh);
		chrome.bookmarks.onRemoved.addListener(scheduleRefresh);
		chrome.bookmarks.onChanged.addListener(scheduleRefresh);
		chrome.bookmarks.onMoved.addListener(scheduleRefresh);

		return () => {
			requestRevisionRef.current += 1;
			if (refreshTimeout) clearTimeout(refreshTimeout);
			chrome.bookmarks.onCreated.removeListener(scheduleRefresh);
			chrome.bookmarks.onRemoved.removeListener(scheduleRefresh);
			chrome.bookmarks.onChanged.removeListener(scheduleRefresh);
			chrome.bookmarks.onMoved.removeListener(scheduleRefresh);
		};
	}, [refreshBookmarks]);

	return bookmarks;
};

export { useBookmarks };
