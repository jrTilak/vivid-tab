import type { BookmarkFolderNode, Bookmarks } from "@/types/bookmark";

export type FlattenedBookmarkFolder = {
	id: string;
	title: string;
	depth: number;
};

const isBookmarkFolder = (
	bookmark: Bookmarks[number],
): bookmark is BookmarkFolderNode => !("url" in bookmark);

/**
 * Flattens a bookmark tree in display order while retaining nesting depth.
 *
 * A shared output array avoids allocating and concatenating an array for every
 * nested folder. URL bookmarks are skipped because only folders can be selected
 * as Vivid Tab's root.
 */
export const flattenBookmarkFolders = (
	bookmarks: Bookmarks,
	depth = 0,
	output: FlattenedBookmarkFolder[] = [],
): FlattenedBookmarkFolder[] => {
	for (const bookmark of bookmarks) {
		if (!isBookmarkFolder(bookmark)) continue;

		output.push({
			id: bookmark.id,
			title: bookmark.title,
			depth,
		});

		if (bookmark.children?.length) {
			flattenBookmarkFolders(bookmark.children, depth + 1, output);
		}
	}

	return output;
};
