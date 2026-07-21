import { useDraggable, useDroppable } from "@dnd-kit/core";
import { IconExternalLink } from "@tabler/icons-react";
import { memo, useCallback } from "react";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuShortcut,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useIcon } from "@/hooks/use-icon";
import { getFileIcon } from "@/lib/bookmarks";
import { cn } from "@/lib/cn";
import type { BookmarkUrlNode } from "@/types/bookmark";
import type { RequestBookmarkAction } from "../bookmark-actions";
import { BookmarkContextActions } from "../bookmark-context-actions";
import { getBookmarkFaviconUrl } from "../bookmark-display";
import { BookmarkIcon } from "../bookmark-icon";
import { openBookmarkUrl } from "../open-bookmark-url";

type Props = BookmarkUrlNode & {
	layout: "grid" | "list";
	disableContextMenu?: boolean;
	index: number;
	onAction: RequestBookmarkAction;
	openUrlIn: "current-tab" | "new-tab";
};

const BookmarkUrl = ({
	disableContextMenu = false,
	onAction,
	...props
}: Props) => {
	const { icon } = useIcon({
		id: props.id,
		defaultIcon: getFileIcon(props.url),
	});
	const faviconUrl = getBookmarkFaviconUrl(props.url);

	const { isOver, setNodeRef } = useDroppable({
		id: props.id,
		data: { index: props.index, parentId: props.parentId },
		disabled: disableContextMenu,
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
		disabled: disableContextMenu,
	});

	const style = transform
		? {
				transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
			}
		: undefined;

	const handleClick = (url: string, aux: boolean = false) => {
		if (aux) {
			openBookmarkUrl(url, true);
		} else {
			openBookmarkUrl(url, props.openUrlIn !== "current-tab");
		}
	};
	const setListNodeRef = useCallback(
		(node: HTMLButtonElement | null) => {
			setNodeRef(node);
			draggableRef(node);
		},
		[draggableRef, setNodeRef],
	);

	return (
		<ContextMenu>
			<ContextMenuTrigger disabled={disableContextMenu}>
				{props.layout === "grid" ? (
					<div ref={disableContextMenu ? null : setNodeRef}>
						<button
							ref={disableContextMenu ? null : draggableRef}
							style={style}
							onClick={() => handleClick(props.url)}
							onAuxClick={(event) => {
								if (event.button === 1) {
									// Middle mouse button
									handleClick(props.url, true);
								}
							}}
							className={cn(
								"flex w-24 cursor-pointer flex-col items-center space-y-1 rounded-lg p-2 text-center text-xs transition-transform hover:scale-105 hover:bg-accent/70 disabled:cursor-default in-data-[visual-effect=opaque]:hover:bg-accent in-data-[visual-effect=translucent]:hover:bg-accent/60",
								isOver && "bg-accent/10",
								isDragging && "bg-destructive/20",
								isDragging && "relative z-50",
							)}
							{...(disableContextMenu ? {} : attributes)}
							{...(disableContextMenu ? {} : listeners)}
						>
							<BookmarkIcon
								className="mx-auto transition-transform"
								src={icon ?? faviconUrl}
								title={props.title}
							/>
							<p className="text-center line-clamp-2 text-xs break-all">
								{props.title}
							</p>
						</button>
					</div>
				) : (
					<button
						type="button"
						ref={disableContextMenu ? null : setListNodeRef}
						style={style}
						onClick={() => handleClick(props.url)}
						onAuxClick={(event) => {
							if (event.button === 1) {
								// Middle mouse button
								handleClick(props.url, true);
							}
						}}
						className={cn(
							"flex w-full cursor-pointer items-center gap-2 overflow-hidden rounded-lg p-2 transition-all hover:bg-accent/70 disabled:cursor-default in-data-[visual-effect=opaque]:hover:bg-accent in-data-[visual-effect=translucent]:hover:bg-accent/60",
							isOver && "bg-accent/10",
							isDragging && "bg-destructive/20",
							isDragging && "relative z-50",
						)}
						rel="noreferrer"
						{...(disableContextMenu ? {} : attributes)}
						{...(disableContextMenu ? {} : listeners)}
					>
						<BookmarkIcon
							className={cn(
								"mx-auto transition-transform",
								isDragging && "scale-105",
							)}
							src={icon ?? faviconUrl}
							title={props.title}
						/>
						<p className="text-xs w-full text-left line-clamp-2">
							{props.title}
							<br />
							{props.url}
						</p>
					</button>
				)}
			</ContextMenuTrigger>
			<ContextMenuContent className="w-fit min-w-40">
				<ContextMenuItem onClick={() => openBookmarkUrl(props.url, true)}>
					Open in new tab
					<ContextMenuShortcut>
						<IconExternalLink className="size-4" />
					</ContextMenuShortcut>
				</ContextMenuItem>
				<ContextMenuSeparator className="bg-border/50" />
				<BookmarkContextActions
					onAction={onAction}
					target={{
						id: props.id,
						kind: "url",
						title: props.title,
						url: props.url,
					}}
				/>
			</ContextMenuContent>
		</ContextMenu>
	);
};

const MemoizedBookmarkUrl = memo(BookmarkUrl);

export { MemoizedBookmarkUrl as BookmarkUrl };
