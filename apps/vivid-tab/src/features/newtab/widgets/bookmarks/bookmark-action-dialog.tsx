import type { BookmarkActionRequest } from "./bookmark-actions";
import { CreateABookmark } from "./create-a-bookmark";
import { CreateAFolder } from "./create-a-folder";
import { DeleteDialog } from "./delete-dialog";
import { MoveBookmarkDialog } from "./move-bookmark-dialog";

type BookmarkActionDialogProps = {
	onClose: () => void;
	request?: BookmarkActionRequest;
};

/** Mounts only the active bookmark dialog, keeping per-item listener counts flat. */
const BookmarkActionDialog = ({
	onClose,
	request,
}: BookmarkActionDialogProps) => {
	if (!request) return null;

	const { action, target } = request;
	const setOpen = (open: boolean) => {
		if (!open) onClose();
	};

	if (action === "edit") {
		return target.kind === "url" ? (
			<CreateABookmark
				defaultValues={{
					id: target.id,
					title: target.title,
					url: target.url,
				}}
				open
				setOpen={setOpen}
			/>
		) : (
			<CreateAFolder
				defaultValues={{ id: target.id, title: target.title }}
				open
				setOpen={setOpen}
			/>
		);
	}

	if (action === "move") {
		return (
			<MoveBookmarkDialog
				id={target.id}
				label={`${target.title} ${target.kind === "url" ? "bookmark" : "folder"}`}
				onOpenChange={setOpen}
				open
			/>
		);
	}

	return (
		<DeleteDialog
			id={target.id}
			label={`${target.title} ${
				target.kind === "url" ? "bookmark" : "folder and its contents"
			}`}
			onOpenChange={setOpen}
			open
			url={target.kind === "url" ? target.url : undefined}
		/>
	);
};

export { BookmarkActionDialog };
