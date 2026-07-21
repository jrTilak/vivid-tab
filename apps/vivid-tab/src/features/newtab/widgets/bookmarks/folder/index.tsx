import { useDraggable, useDroppable } from "@dnd-kit/core";
import { memo } from "react";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useIcon } from "@/hooks/use-icon";
import { cn } from "@/lib/cn";
import type { BookmarkFolderNode } from "@/types/bookmark";
import type { RequestBookmarkAction } from "../bookmark-actions";
import { BookmarkContextActions } from "../bookmark-context-actions";
import { getFolderCounts } from "../bookmark-tree";

type Props = BookmarkFolderNode & {
	onOpenFolder: (folderId: string) => void;
	layout: "grid" | "list";
	index: number;
	onAction: RequestBookmarkAction;
};

const BookmarkFolder = (props: Props) => {
	const { icon } = useIcon({ id: props.id });
	const counts = getFolderCounts(props.children);

	const { isOver, setNodeRef } = useDroppable({
		id: props.id,
		data: { index: props.index, parentId: props.parentId },
	});

	const {
		attributes,
		listeners,
		setNodeRef: draggableRef,
		isDragging,
		transform,
	} = useDraggable({
		id: props.id,
		data: { index: props.index, parentId: props.parentId },
	});

	const style = transform
		? {
				transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
			}
		: undefined;

	return (
		<ContextMenu>
			<ContextMenuTrigger>
				{props.layout === "grid" ? (
					<button
						type="button"
						ref={setNodeRef}
						style={style}
						onClick={() => props.onOpenFolder(props.id)}
						className={cn(
							"flex w-24 cursor-pointer flex-col space-y-1 rounded-lg p-2 transition-transform hover:scale-105 hover:bg-accent/70 disabled:cursor-default disabled:opacity-50 in-data-[visual-effect=opaque]:hover:bg-accent in-data-[visual-effect=translucent]:hover:bg-accent/60",
							isOver && "bg-accent/10",
							isDragging && "bg-destructive/20",
							isDragging && "relative z-50",
						)}
					>
						{icon ? (
							<div
								ref={draggableRef}
								{...attributes}
								{...listeners}
								className={cn(
									"relative size-12 mx-auto rounded-md object-contain object-center",
									isDragging && "scale-105",
								)}
							>
								<img
									src={chrome.runtime.getURL("assets/folder-svgrepo-com.png")}
									alt="Folder"
								/>
								<img
									src={icon}
									alt=""
									className="absolute w-10 h-6 object-cover object-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md shadow-inner brightness-90"
								/>
							</div>
						) : (
							<img
								ref={draggableRef}
								{...attributes}
								{...listeners}
								src={chrome.runtime.getURL("assets/folder-svgrepo-com.png")}
								alt=""
								className={cn(
									"size-12 mx-auto rounded-md object-contain object-center",
									isDragging && "scale-105",
								)}
							/>
						)}
						<p className="text-center line-clamp-2 text-xs break-all">
							{props.title} ({props.children?.length ?? 0})
						</p>
					</button>
				) : (
					<button
						type="button"
						onClick={() => props.onOpenFolder(props.id)}
						style={style}
						ref={setNodeRef}
						className={cn(
							"flex cursor-pointer items-center gap-2 rounded-lg p-2 transition-all hover:bg-accent/70 disabled:cursor-default disabled:opacity-50 in-data-[visual-effect=opaque]:hover:bg-accent in-data-[visual-effect=translucent]:hover:bg-accent/60",
							isOver && "bg-accent/10",
							isDragging && "scale-110 bg-destructive/20",
							isDragging && "relative z-50",
						)}
					>
						{icon ? (
							<div
								ref={draggableRef}
								{...attributes}
								{...listeners}
								className={cn(
									"relative min-w-12 size-12 mx-auto rounded-md object-contain object-center",
									isDragging && "scale-105",
								)}
							>
								<img
									src={chrome.runtime.getURL("assets/folder-svgrepo-com.png")}
									className="size-12 min-w-12"
									alt="Folder"
								/>
								<img
									src={icon}
									alt=""
									className="absolute w-10 h-8 object-cover object-center top-1/2 left-1/2 -translate-x-1/2 translate-y-[-40%] rounded-md shadow-inner brightness-90"
								/>
							</div>
						) : (
							<img
								ref={draggableRef}
								{...attributes}
								{...listeners}
								src={chrome.runtime.getURL("assets/folder-svgrepo-com.png")}
								alt=""
								className={cn(
									"size-12 mx-auto rounded-md object-contain object-center",
									isDragging && "scale-105",
								)}
							/>
						)}
						<p className="text-xs w-full text-left line-clamp-2">
							{props.title}
							<br />
							{counts.folders}f, {counts.bookmarks}b
						</p>
					</button>
				)}
			</ContextMenuTrigger>
			<ContextMenuContent className="w-fit min-w-40">
				<BookmarkContextActions
					onAction={props.onAction}
					target={{ id: props.id, kind: "folder", title: props.title }}
				/>
			</ContextMenuContent>
		</ContextMenu>
	);
};

const MemoizedBookmarkFolder = memo(BookmarkFolder);

export { MemoizedBookmarkFolder as BookmarkFolder };
