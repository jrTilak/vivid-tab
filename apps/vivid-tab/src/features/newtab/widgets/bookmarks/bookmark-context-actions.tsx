import { IconArrowsMove, IconEdit, IconTrash } from "@tabler/icons-react";
import {
	ContextMenuItem,
	ContextMenuShortcut,
} from "@/components/ui/context-menu";
import type {
	BookmarkActionTarget,
	RequestBookmarkAction,
} from "./bookmark-actions";

interface BookmarkContextActionsProps {
	onAction: RequestBookmarkAction;
	target: BookmarkActionTarget;
}

const BookmarkContextActions = ({
	onAction,
	target,
}: BookmarkContextActionsProps) => (
	<>
		<ContextMenuItem onSelect={() => onAction("edit", target)}>
			Edit
			<ContextMenuShortcut>
				<IconEdit className="size-4" />
			</ContextMenuShortcut>
		</ContextMenuItem>
		<ContextMenuItem onSelect={() => onAction("move", target)}>
			Move
			<ContextMenuShortcut>
				<IconArrowsMove className="size-4" />
			</ContextMenuShortcut>
		</ContextMenuItem>
		<ContextMenuItem
			className="text-destructive"
			variant="destructive"
			onSelect={() => onAction("delete", target)}
		>
			Delete
			<ContextMenuShortcut>
				<IconTrash className="size-4" />
			</ContextMenuShortcut>
		</ContextMenuItem>
	</>
);

export { BookmarkContextActions };
