import type { FlattenedBookmarkFolder } from "@/lib/bookmarks";
import type {
	Bookmark,
	BookmarkFolderNode,
	Bookmarks,
	BookmarkUrlNode,
} from "@/types/bookmark";

export type BookmarkView = {
	currentFolderChildren: Bookmark[];
	currentParentId?: string;
	folderStack: BookmarkFolderNode[];
	rootChildren: BookmarkUrlNode[];
	rootFolders: BookmarkFolderNode[];
};

export const isBookmarkFolder = (
	bookmark: Bookmark,
): bookmark is BookmarkFolderNode => bookmark.url === undefined;

/** Rebuilds navigation from live bookmark data, dropping stale path segments. */
export const deriveBookmarkView = (
	bookmarks: Bookmarks,
	rootFolderId: string,
	activeRootFolder: string,
	folderIdStack: readonly string[],
): BookmarkView => {
	const rootChildren = bookmarks.filter(
		(bookmark): bookmark is BookmarkUrlNode => !isBookmarkFolder(bookmark),
	);
	const rootFolders = bookmarks.filter(isBookmarkFolder);
	const folderStack: BookmarkFolderNode[] = [];
	let currentFolderChildren: Bookmark[] = [];
	let currentParentId: string | undefined;

	if (folderIdStack.length === 0) {
		if (activeRootFolder === "home") {
			currentFolderChildren = rootChildren;
			currentParentId = rootFolderId;
		} else if (
			activeRootFolder !== "history" &&
			activeRootFolder !== "top-sites"
		) {
			const selectedFolder = rootFolders.find(
				(folder) => folder.id === activeRootFolder,
			);
			currentFolderChildren = selectedFolder?.children ?? [];
			currentParentId = selectedFolder?.id;
		}
	} else {
		let searchChildren: Bookmark[] =
			activeRootFolder === "home"
				? [...rootChildren, ...rootFolders]
				: (rootFolders.find((folder) => folder.id === activeRootFolder)
						?.children ?? []);

		for (const folderId of folderIdStack) {
			const folder = searchChildren.find(
				(child): child is BookmarkFolderNode =>
					isBookmarkFolder(child) && child.id === folderId,
			);

			if (!folder) break;

			folderStack.push(folder);
			searchChildren = folder.children ?? [];
		}

		const currentFolder = folderStack.at(-1);
		currentFolderChildren = currentFolder?.children ?? [];
		currentParentId = currentFolder?.id;
	}

	return {
		currentFolderChildren,
		currentParentId,
		folderStack,
		rootChildren,
		rootFolders,
	};
};

/** Chrome supplies indexes, but sorting a copy avoids mutating hook state. */
export const sortBookmarksByIndex = <Item extends { index: number }>(
	bookmarks: readonly Item[],
) => [...bookmarks].sort((first, second) => first.index - second.index);

export const getFolderCounts = (children: Bookmarks = []) => ({
	bookmarks: children.filter((child) => !isBookmarkFolder(child)).length,
	folders: children.filter(isBookmarkFolder).length,
});

export const resolveActiveRootFolder = ({
	candidate,
	hasHomeBookmarks,
	rootFolderIds,
	showHistory,
	showTopSites,
}: {
	candidate?: string;
	hasHomeBookmarks: boolean;
	rootFolderIds: readonly string[];
	showHistory: boolean;
	showTopSites: boolean;
}) => {
	if (candidate === "home" && hasHomeBookmarks) return candidate;
	if (candidate === "history" && showHistory) return candidate;
	if (candidate === "top-sites" && showTopSites) return candidate;
	if (candidate && rootFolderIds.includes(candidate)) return candidate;
	if (hasHomeBookmarks) return "home";

	return rootFolderIds[0] ?? "home";
};

/** Excludes a folder and all of its descendants from its move destinations. */
export const getValidMoveFolders = (
	folders: readonly FlattenedBookmarkFolder[],
	targetId: string,
) => {
	const targetIndex = folders.findIndex((folder) => folder.id === targetId);
	if (targetIndex < 0) return folders;

	const targetDepth = folders[targetIndex].depth;
	let descendantEnd = targetIndex + 1;

	while (
		descendantEnd < folders.length &&
		folders[descendantEnd].depth > targetDepth
	) {
		descendantEnd += 1;
	}

	return folders.filter(
		(_, index) => index < targetIndex || index >= descendantEnd,
	);
};
