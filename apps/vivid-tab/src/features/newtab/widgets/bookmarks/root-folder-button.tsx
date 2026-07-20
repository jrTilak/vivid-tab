import { useDraggable, useDroppable } from "@dnd-kit/core";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/cn";
import type { RequestBookmarkAction } from "./bookmark-actions";
import { BookmarkContextActions } from "./bookmark-context-actions";

type Props = {
	id: string;
	index: number;
	label: string;
	onSelect: (folderId: string) => void;
	parentId?: string;
	activeRootFolder: string;
	disableDragging?: boolean;
	onAction: RequestBookmarkAction;
};

const RootFolderButton = ({
	id,
	index,
	label,
	onSelect,
	parentId,
	activeRootFolder,
	disableDragging,
	onAction,
}: Props) => {
	const { isOver, setNodeRef } = useDroppable({
		id,
		data: { index, parentId },
		disabled: disableDragging,
	});

	const {
		attributes,
		listeners,
		setNodeRef: draggableRef,
		transform,
		isDragging,
	} = useDraggable({
		id,
		data: { index, parentId },
		disabled: disableDragging,
	});

	const style = transform
		? {
				transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
			}
		: undefined;

	return (
		<ContextMenu>
			<ContextMenuTrigger disabled={disableDragging}>
				<div style={style} ref={disableDragging ? null : setNodeRef}>
					<Button
						onClick={() => onSelect(id)}
						variant={activeRootFolder === id ? "default" : "ghost"}
						size="sm"
						className={cn(
							"text-xs px-2.5 py-1 h-fit rounded-sm",
							activeRootFolder !== id &&
								"dark:bg-muted/20 hover:bg-muted/30 text-white",
							isOver && "bg-destructive",
							isDragging && "scale-110",
						)}
						{...(disableDragging
							? {}
							: { ref: draggableRef, ...listeners, ...attributes })}
					>
						{label}
					</Button>
				</div>
			</ContextMenuTrigger>
			<ContextMenuContent className="w-fit min-w-40">
				<BookmarkContextActions
					onAction={onAction}
					target={{ id, kind: "folder", title: label }}
				/>
			</ContextMenuContent>
		</ContextMenu>
	);
};

const MemoizedRootFolderButton = memo(RootFolderButton);

export { MemoizedRootFolderButton as RootFolderButton };
