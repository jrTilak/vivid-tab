export type BookmarkAction = "delete" | "edit" | "move";

export type BookmarkActionTarget =
	| {
			id: string;
			kind: "folder";
			title: string;
	  }
	| {
			id: string;
			kind: "url";
			title: string;
			url: string;
	  };

export type BookmarkActionRequest = {
	action: BookmarkAction;
	target: BookmarkActionTarget;
};

export type RequestBookmarkAction = (
	action: BookmarkAction,
	target: BookmarkActionTarget,
) => void;
