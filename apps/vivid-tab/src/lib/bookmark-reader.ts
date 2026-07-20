import type { Bookmarks } from "@/types/bookmark";

const getRuntimeError = (): Error | undefined => {
	const error = chrome.runtime.lastError;

	return error ? new Error(error.message) : undefined;
};

const getBookmarkTree = (): Promise<chrome.bookmarks.BookmarkTreeNode[]> =>
	new Promise((resolve, reject) => {
		chrome.bookmarks.getTree((nodes) => {
			const error = getRuntimeError();
			error ? reject(error) : resolve(nodes);
		});
	});

const getBookmarkSubTree = (
	id: string,
): Promise<chrome.bookmarks.BookmarkTreeNode[]> =>
	new Promise((resolve, reject) => {
		chrome.bookmarks.getSubTree(id, (nodes) => {
			const error = getRuntimeError();
			error ? reject(error) : resolve(nodes);
		});
	});

const getBookmarkChildren = (
	nodes: chrome.bookmarks.BookmarkTreeNode[],
): Bookmarks => {
	const root = nodes[0];
	if (!root) return [];

	return (root.children ?? nodes) as Bookmarks;
};

/** Reads only the configured subtree when a root folder is available. */
const readBookmarks = async (rootFolderId?: string): Promise<Bookmarks> => {
	const nodes = rootFolderId
		? await getBookmarkSubTree(rootFolderId)
		: await getBookmarkTree();

	return getBookmarkChildren(nodes);
};

export { getBookmarkChildren, readBookmarks };
