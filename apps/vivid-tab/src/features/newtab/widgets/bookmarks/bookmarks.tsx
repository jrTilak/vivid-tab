import {
	DndContext,
	type DragEndEvent,
	MouseSensor,
	TouchSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	IconArrowLeft,
	IconBookmarkPlus,
	IconFolderPlus,
	IconPlus,
} from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { useHistory } from "@/hooks/use-history";
import { useTopSites } from "@/hooks/use-top-sites";
import { cn } from "@/lib/cn";
import { useSettings } from "@/providers/settings-provider";
import type { BookmarkUrlNode } from "@/types/bookmark";
import { BookmarkActionDialog } from "./bookmark-action-dialog";
import type {
	BookmarkActionRequest,
	RequestBookmarkAction,
} from "./bookmark-actions";
import { getBookmarkReorder } from "./bookmark-dnd";
import {
	readActiveRootFolder,
	writeActiveRootFolder,
} from "./bookmark-navigation-storage";
import {
	deriveBookmarkView,
	isBookmarkFolder,
	resolveActiveRootFolder,
	sortBookmarksByIndex,
} from "./bookmark-tree";
import { CreateABookmark } from "./create-a-bookmark";
import { CreateAFolder } from "./create-a-folder";
import { BookmarkFolder } from "./folder";
import { RootFolderButton } from "./root-folder-button";
import { BookmarkUrl } from "./url";

const Bookmarks = () => {
	const [activeRootFolder, setActiveRootFolder] = useState("home");

	// Only store folder IDs for navigation - derive everything else from live bookmark data
	const [folderIdStack, setFolderIdStack] = useState<string[]>([]);

	const {
		settings: { general },
	} = useSettings();
	const bookmarks = useBookmarks(general.rootFolder);
	const { history, hasPermission, requestPermission } = useHistory(
		general.showHistory && activeRootFolder === "history",
	);
	const topSites = useTopSites(
		general.showTopSites && activeRootFolder === "top-sites",
	);
	const [isCreateABookmarkDialogOpen, setIsCreateABookmarkDialogOpen] =
		useState(false);
	const [isCreateAFolderDialogOpen, setIsCreateAFolderDialogOpen] =
		useState(false);
	const [bookmarkAction, setBookmarkAction] = useState<BookmarkActionRequest>();

	// Derive all state from live bookmark data
	const {
		rootChildren,
		rootFolders,
		currentFolderChildren,
		currentParentId,
		folderStack,
	} = useMemo(
		() =>
			deriveBookmarkView(
				bookmarks,
				general.rootFolder,
				activeRootFolder,
				folderIdStack,
			),
		[activeRootFolder, bookmarks, folderIdStack, general.rootFolder],
	);

	// Clean up folder stack if folders were deleted
	useEffect(() => {
		if (folderIdStack.length > folderStack.length) {
			setFolderIdStack((prev) => prev.slice(0, folderStack.length));
		}
	}, [folderStack.length, folderIdStack.length]);

	const onDragEnd = ({ active, over }: DragEndEvent) => {
		const reorder = getBookmarkReorder({
			fromId: active.id,
			fromIndex: active.data.current?.index,
			fromParentId: active.data.current?.parentId,
			toId: over?.id,
			toIndex: over?.data.current?.index,
			toParentId: over?.data.current?.parentId,
		});

		if (!reorder) return;

		chrome.bookmarks.move(reorder.bookmarkId, { index: reorder.index });
	};

	const rootFolderIds = useMemo(
		() => rootFolders.map((folder) => folder.id),
		[rootFolders],
	);

	useEffect(() => {
		let cancelled = false;

		void readActiveRootFolder().then((candidate) => {
			if (cancelled) return;

			setActiveRootFolder(
				resolveActiveRootFolder({
					candidate,
					hasHomeBookmarks: rootChildren.length > 0,
					rootFolderIds,
					showHistory: general.showHistory,
					showTopSites: general.showTopSites,
				}),
			);
		});

		return () => {
			cancelled = true;
		};
	}, [
		general.showHistory,
		general.showTopSites,
		rootChildren.length,
		rootFolderIds,
	]);

	const requestBookmarkAction = useCallback<RequestBookmarkAction>(
		(action, target) => setBookmarkAction({ action, target }),
		[],
	);
	const openFolder = useCallback((folderId: string) => {
		setFolderIdStack((previous) => [...previous, folderId]);
	}, []);
	const selectRootFolder = useCallback((folderId: string) => {
		setActiveRootFolder(folderId);
		setFolderIdStack([]);
		void writeActiveRootFolder(folderId);
	}, []);

	// Custom delayed sensors
	const mouseSensor = useSensor(MouseSensor, {
		activationConstraint: {
			delay: 250, // 250ms delay before drag starts
			tolerance: 5, // Prevents unintended drags
		},
	});

	const touchSensor = useSensor(TouchSensor, {
		activationConstraint: {
			delay: 250, // 250ms hold before dragging
			tolerance: 10,
		},
	});

	const sensors = useSensors(mouseSensor, touchSensor);

	return (
		<DndContext onDragEnd={onDragEnd} sensors={sensors}>
			<BookmarkActionDialog
				onClose={() => setBookmarkAction(undefined)}
				request={bookmarkAction}
			/>
			<CreateABookmark
				parentId={currentParentId}
				open={isCreateABookmarkDialogOpen}
				setOpen={setIsCreateABookmarkDialogOpen}
			/>
			<CreateAFolder
				parentId={currentParentId}
				open={isCreateAFolderDialogOpen}
				setOpen={setIsCreateAFolderDialogOpen}
			/>
			<div className="col-span-6 mb-6 h-[70vh] overflow-scroll __vivid_hide-scrollbar">
				<div className="flex justify-between gap-6 mb-4">
					<div className="flex gap-2.5 flex-wrap ">
						{sortBookmarksByIndex(
							[
								rootChildren.length > 0 && {
									id: "home",
									label: "Home",
									index: 0,
								},
								...rootFolders.map((folder) => ({
									id: folder.id,
									label: folder.title,
									...folder,
								})),
								general.showTopSites && {
									id: "top-sites",
									label: "Top Sites",
									index: 9999998,
								},
								general.showHistory && {
									id: "history",
									label: "History",
									index: 9999999,
								},
							].filter(Boolean),
						).map((item) => (
							<RootFolderButton
								key={item.id}
								id={item.id}
								index={item.index}
								label={item.label}
								disableDragging={
									item.id === "home" ||
									item.id === "history" ||
									item.id === "top-sites"
								}
								onAction={requestBookmarkAction}
								onSelect={selectRootFolder}
								parentId={"parentId" in item ? item.parentId : undefined}
								activeRootFolder={activeRootFolder}
							/>
						))}
						<Button
							aria-label="Create bookmark folder"
							className="size-7"
							onClick={() => {
								setIsCreateAFolderDialogOpen(true);
							}}
							size="icon-sm"
							variant="secondary"
						>
							<IconPlus className="size-4" />
						</Button>
					</div>
					<div className="flex h-fit gap-1 rounded-md bg-muted/40 p-1 in-data-[visual-effect=opaque]:bg-muted in-data-[visual-effect=translucent]:bg-muted/40">
						<Button
							aria-label="Create bookmark folder"
							onClick={() => {
								setIsCreateAFolderDialogOpen(true);
							}}
							disabled={
								activeRootFolder === "history" ||
								activeRootFolder === "top-sites"
							}
							size="icon-sm"
							variant="ghost"
						>
							<IconFolderPlus className="size-5 text-foreground" />
						</Button>
						<Button
							aria-label="Create bookmark"
							onClick={() => {
								setIsCreateABookmarkDialogOpen(true);
							}}
							disabled={
								activeRootFolder === "history" ||
								activeRootFolder === "top-sites"
							}
							size="icon-sm"
							variant="ghost"
						>
							<IconBookmarkPlus className="size-5 text-foreground" />
						</Button>
					</div>
				</div>
				<div className="bg-transparent">
					{folderIdStack.length > 0 && (
						<Button
							onClick={() => {
								setFolderIdStack((prev) => prev.slice(0, -1));
							}}
							variant="ghost"
							size="sm"
							className="text-xs hover:bg-transparent! text-foreground mb-2 "
						>
							<IconArrowLeft className="size-4" />
							Back
						</Button>
					)}
					<Card className="min-h-[100px] gap-0 overflow-visible py-0">
						<CardContent
							className={cn(
								"min-h-[100px] px-5 py-2",
								general.layout === "grid"
									? "grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-x-2 gap-y-2"
									: "grid grid-cols-2 gap-3 xl:grid-cols-3",
							)}
						>
							{activeRootFolder === "history" ? (
								hasPermission ? (
									history?.map((item, i) => (
										<BookmarkUrl
											{...item}
											key={item.id}
											layout={general.layout}
											dateAdded={item.lastVisitTime}
											disableContextMenu={true}
											index={i}
											onAction={requestBookmarkAction}
											openUrlIn={general.openUrlIn}
										/>
									))
								) : (
									<div className="flex items-center justify-center col-span-12">
										<Button variant="secondary" onClick={requestPermission}>
											Enable History Access
										</Button>
									</div>
								)
							) : activeRootFolder === "top-sites" ? (
								topSites.map((item, i) => (
									<BookmarkUrl
										key={item.url}
										id={item.url}
										title={item.title}
										url={item.url}
										layout={general.layout}
										openUrlIn={general.openUrlIn}
										index={i}
										dateAdded={0}
										disableContextMenu={true}
										onAction={requestBookmarkAction}
									/>
								))
							) : (
								sortBookmarksByIndex(currentFolderChildren).map((item) => {
									if (isBookmarkFolder(item)) {
										return (
											<BookmarkFolder
												{...item}
												key={item.id}
												layout={general.layout}
												onAction={requestBookmarkAction}
												onOpenFolder={openFolder}
												index={item.index}
											/>
										);
									} else {
										return (
											<BookmarkUrl
												{...(item as BookmarkUrlNode)}
												key={item.id}
												layout={general.layout}
												onAction={requestBookmarkAction}
												openUrlIn={general.openUrlIn}
												index={item.index}
											/>
										);
									}
								})
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</DndContext>
	);
};

export { Bookmarks };
