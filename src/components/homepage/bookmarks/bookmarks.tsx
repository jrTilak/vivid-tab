import { Button } from "@/components/ui/button"
import { cn } from "@/lib/cn"
import useBookmarks from "@/hooks/use-bookmarks"
import useHistory from "@/hooks/use-history"
import { useSettings } from "@/providers/settings-provider"
import type {
  Bookmark,
  BookmarkFolderNode,
  BookmarkUrlNode,
} from "@/types/bookmark-types"
import {
  ArrowLeftIcon,
  BookmarkPlusIcon,
  FolderPlusIcon,
  PlusIcon,
  DeleteIcon,
  EditIcon, 
  MoveIcon
} from "lucide-react"
import { useEffect, useState } from "react"

import BookmarkFolder from "./folder"
import BookmarkUrl from "./url"
import CreateAFolder from "./create-a-folder"
import CreateABookmark from "./create-a-bookmark"
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import RootFolderButton from "./root-folder-button"
import useTopSites from "@/hooks/use-top-sites"
import { useTheme } from "@/providers/theme-provider"

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import DeleteDialog from "./delete-dialog"
import EditBookmarkTab from "./edit-bookmark-tab"

const Bookmarks = () => {
  const [activeRootFolder, setActiveRootFolder] = useState("home")
  const { theme } = useTheme()

  const [rootChildren, setRootChildren] = useState<BookmarkUrlNode[]>([])
  const [rootFolders, setRootFolders] = useState<BookmarkFolderNode[]>([])
  const [folderStack, setFolderStack] = useState<Bookmark[]>([])
  const history = useHistory()
  const topSites = useTopSites()

  const {
    settings: { general },

  } = useSettings()
  const bookmarks = useBookmarks(general.rootFolder)
  const [createAFolderId, setCreateAFolderId] = useState<string | undefined>(
    general.rootFolder,
  )
  const [isCreateABookmarkDialogOpen, setIsCreateABookmarkDialogOpen] =
    useState(false)
  const [isCreateAFolderDialogOpen, setIsCreateAFolderDialogOpen] =
    useState(false)
  const [createFolderParentId, setCreateFolderParentId] = useState("")
  const [editFolder, setEditFolder] = useState<BookmarkFolderNode | undefined>(undefined)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  useEffect(() => {
    if (bookmarks.length) {
      setRootChildren(
        bookmarks.filter((item) => !("children" in item)) as BookmarkUrlNode[],
      )
      setRootFolders(
        bookmarks.filter((item) => "children" in item) as BookmarkFolderNode[],
      )
    }
  }, [bookmarks])

  useEffect(() => {
    if (activeRootFolder !== "history") {
      setCreateAFolderId(
        activeRootFolder === "home" ? general.rootFolder : activeRootFolder,
      )
    }
  }, [activeRootFolder, general.rootFolder])

  const onDragEnd = ({
    active: {
      id: from,
      data: { current: fromCurrent },
    },
    over: {
      id: to,
      data: { current: toCurrent },
    },
  }: DragEndEvent) => {

    if (from === to) {
      console.log("Same item, returning")

      return
    }

    chrome.bookmarks.move(
      String(from),
      { index: fromCurrent.index > toCurrent.index ? toCurrent.index : toCurrent.index + 1 },
    )

  }

  const sortBookmarks = <T extends { index: number }>(bookmarks: T[]) => {
    // sort by index
    return bookmarks?.sort((a, b) => a.index - b.index) || []
  }

  useEffect(() => {
    chrome.storage.sync.get("activeRootFolder", (data) => {

      if (data.activeRootFolder) {
        setActiveRootFolder(data.activeRootFolder)
      } else if (rootChildren.length === 0 && rootFolders.length > 0) {
        setActiveRootFolder(rootFolders[0].id)
      }
    })
  }, [rootChildren.length, rootFolders])

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
      <CreateABookmark
        parentId={createAFolderId}
        open={isCreateABookmarkDialogOpen}
        setOpen={setIsCreateABookmarkDialogOpen}
      />
      <CreateAFolder
        parentId={createFolderParentId}
        open={isCreateAFolderDialogOpen}
        setOpen={setIsCreateAFolderDialogOpen}
      />
      <EditBookmarkTab
        open={isEditDialogOpen}
        setOpen={setIsEditDialogOpen}
        id={editFolder?.id}
        title={editFolder?.title}
      />
      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        id={editFolder?.id}
        label={editFolder?.title + " tab and it's contents"}
      />     
      <div
        className={cn("mb-6 col-span-6 h-[70vh] overflow-scroll __vivid_hide-scrollbar", theme === "light" ? "dark" : "light")}

      >
        <div className="flex justify-between gap-6 mb-4">
          <div className="flex gap-2.5 flex-wrap ">
            {sortBookmarks([
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
                index: 9999998
              },
              general.showHistory && {
                id: "history",
                label: "History",
                index: 9999999
              },
            ]
              .filter(Boolean))
              .map((item) => (      
                (item.id === "home" || item.id === "history" || item.id === "top-sites") ? (
                  <RootFolderButton
                    key={item.id}
                    disableDragging
                    item={item}
                    onClick={() => {
                      setActiveRootFolder(item.id)
                      setFolderStack([])
                      chrome.storage.sync.set({ activeRootFolder: item.id })
                    }}
                    activeRootFolder={activeRootFolder}
                  />
                ) : (          
                <ContextMenu key={item.id}>
                  <ContextMenuTrigger>
                    <RootFolderButton
                      disableDragging={item.id === "home" || item.id === "history" || item.id === "top-sites"}
                      item={item}
                      onClick={() => {
                        setActiveRootFolder(item.id)
                        setFolderStack([])
                        chrome.storage.sync.set({ activeRootFolder: item.id })
                      }}
                      activeRootFolder={activeRootFolder}
                    />
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-fit min-w-40">
                    <ContextMenuItem
                      onClick={() => {
                        setEditFolder(item as BookmarkFolderNode)
                        setTimeout(() => setIsEditDialogOpen(true), 100)
                      }}
                    >
                      Edit
                      <ContextMenuShortcut>
                        <EditIcon className="size-4" />
                      </ContextMenuShortcut>
                    </ContextMenuItem>
                    <ContextMenuItem>
                      Move
                      <ContextMenuShortcut>
                        <MoveIcon className="size-4" />
                      </ContextMenuShortcut>
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() => {
                        setEditFolder(item as BookmarkFolderNode)
                        setIsDeleteDialogOpen(true)
                      }}
                      className="text-destructive"
                    >
                      Delete
                      <ContextMenuShortcut>
                        <DeleteIcon className="size-4" />
                      </ContextMenuShortcut>
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              )))}
            <Button
              tabIndex={-1}
              size="sm"
              className="text-xs px-2.5 py-1 h-fit rounded-sm bg-muted/20 hover:bg-muted/30 text-accent-foreground"
              variant="ghost"
              onClick={() => {
                setIsCreateAFolderDialogOpen(true)
                setCreateFolderParentId(general.rootFolder)
              }}
            >
              <PlusIcon className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2.5 bg-muted/20 rounded-sm px-2.5 py-1">
            <button
              onClick={() => {
                setIsCreateAFolderDialogOpen(true)
                setCreateFolderParentId(createAFolderId)
              }}
              disabled={activeRootFolder === "history"}
              tabIndex={-1}
              className="disabled:opacity-50"
            >
              <FolderPlusIcon className="size-5 text-foreground" />
            </button>
            <button
              onClick={() => {
                setIsCreateABookmarkDialogOpen(true)
              }}
              disabled={activeRootFolder === "history"}
              tabIndex={-1}
              className="disabled:opacity-50"
            >
              <BookmarkPlusIcon className="size-5 text-foreground" />
            </button>
          </div>
        </div>
        <div className="bg-transparent">
          {folderStack.length > 0 && (
            <Button
              onClick={() => setFolderStack((prev) => prev.slice(0, -1))}
              variant="ghost"
              size="sm"
              className="text-xs hover:bg-transparent"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back
            </Button>
          )}
          <div
            className={cn(
              general.layout === "grid"
                ? "grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-x-4 gap-y-2"
                : "grid grid-cols-2 xl:grid-cols-3 gap-4",
              "bg-black/20 backdrop-blur-[1px] rounded-lg p-2 px-5 min-h-[100px] text-background dark:text-foreground",
            )}
          >
            {activeRootFolder === "home"
              ? sortBookmarks(rootChildren).map((item) => (
                <BookmarkUrl
                  {...item}
                  key={item.id}
                  layout={general.layout}
                  index={item.index}
                />
              ))
              : activeRootFolder === "history"
                ? history.map((item, i) => (
                  <BookmarkUrl
                    {...item}
                    key={item.id}
                    layout={general.layout}
                    dateAdded={item.lastVisitTime}
                    disableContextMenu={true}
                    index={i}
                  />
                ))
                :

                activeRootFolder === "top-sites"
                  ? topSites.map((item, i) => (
                    <BookmarkUrl
                      key={i}
                      id={item.url}
                      title={item.title}
                      url={item.url}
                      layout={general.layout}
                      index={i}
                      dateAdded={0}
                      disableContextMenu={true}
                    />
                  )) :

                  sortBookmarks((folderStack?.length > 0
                    ? (folderStack[
                      folderStack.length - 1
                    ] as BookmarkFolderNode)
                    : rootFolders?.find(
                      (folder) => folder.id === activeRootFolder,
                    )
                  )?.children)?.map((item) => {
                    if ("children" in item) {
                      return (
                        <BookmarkFolder
                          {...item}
                          key={item.id}
                          layout={general.layout}
                          onOpenFolder={() => {
                            setFolderStack((prev) => [...prev, item])
                          }}
                          index={item.index}
                        />
                      )
                    } else {
                      return (
                        <BookmarkUrl
                          {...(item as BookmarkUrlNode)}
                          key={item.id}
                          layout={general.layout}
                          index={item.index}
                        />
                      )
                    }
                  })}
          </div>
        </div>
      </div>
    </DndContext>
  )
}

export default Bookmarks
