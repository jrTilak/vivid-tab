export type BookmarkReorder = {
	bookmarkId: string;
	index: number;
};

/** Converts optional drag metadata into a safe Chrome bookmark move. */
export const getBookmarkReorder = ({
	fromId,
	fromIndex,
	fromParentId,
	toId,
	toIndex,
	toParentId,
}: {
	fromId: string | number;
	fromIndex: unknown;
	fromParentId: unknown;
	toId?: string | number;
	toIndex: unknown;
	toParentId: unknown;
}): BookmarkReorder | undefined => {
	if (toId === undefined || fromId === toId) return undefined;
	if (
		typeof fromParentId !== "string" ||
		typeof toParentId !== "string" ||
		fromParentId !== toParentId
	) {
		return undefined;
	}
	if (
		typeof fromIndex !== "number" ||
		typeof toIndex !== "number" ||
		!Number.isInteger(fromIndex) ||
		!Number.isInteger(toIndex) ||
		fromIndex < 0 ||
		toIndex < 0
	) {
		return undefined;
	}

	return {
		bookmarkId: String(fromId),
		index: fromIndex > toIndex ? toIndex : toIndex + 1,
	};
};
