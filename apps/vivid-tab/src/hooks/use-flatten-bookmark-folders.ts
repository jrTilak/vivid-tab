import { useMemo } from "react";
import { flattenBookmarkFolders } from "@/lib/bookmarks";
import { useBookmarks } from "./use-bookmarks";

/** Returns bookmark folders in tree order and recomputes only when the tree changes. */
const useFlattenBookmarkFolders = () => {
	const bookmarks = useBookmarks();

	return useMemo(() => flattenBookmarkFolders(bookmarks), [bookmarks]);
};

export { useFlattenBookmarkFolders };
