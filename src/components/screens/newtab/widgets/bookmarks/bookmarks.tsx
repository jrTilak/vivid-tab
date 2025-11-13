import { Button } from "@/components/ui/button"
import { cn } from "@/lib/cn"
import { useBookmarks } from "@/hooks/use-bookmarks"
import { useHistory } from "@/hooks/use-history"
import { useSettings } from "@/providers/settings-provider"
import type {
  Bookmark,
  BookmarkFolderNode,
  BookmarkUrlNode,
} from "@/types/bookmark"
import {
  ArrowLeftIcon,
  BookmarkPlusIcon,
  FolderPlusIcon,
  PlusIcon,
} from "lucide-react"
import { useEffect, useState, useMemo } from "react"

import { BookmarkFolder } from "./folder"
import { BookmarkUrl } from "./url"
import { CreateAFolder } from "./create-a-folder"
import { CreateABookmark } from "./create-a-bookmark"
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { RootFolderButton } from "./root-folder-button"
import { useTopSites } from "@/hooks/use-top-sites"
import { useTheme } from "@/providers/theme-provider"

const Bookmarks = () => {
  const [activeRootFolder, setActiveRootFolder] = useState("home")
  const { theme } = useTheme()

  // Only store folder IDs for navigation - derive everything else from live bookmark data
  const [folderIdStack, setFolderIdStack] = useState<string[]>([])
  const { history, hasPermission, requestPermission } = useHistory()
  const topSites = useTopSites()

  const {
    settings: { general },
  } = useSettings()
  const bookmarks = useBookmarks(general.rootFolder)
  const [isCreateABookmarkDialogOpen, setIsCreateABookmarkDialogOpen] =
    useState(false)
  const [isCreateAFolderDialogOpen, setIsCreateAFolderDialogOpen] =
    useState(false)

  // Derive all state from live bookmark data
  const {
    rootChildren,
    rootFolders,
    currentFolderChildren,
    currentParentId,
    folderStack,
  } = useMemo(() => {
    const rootChildren = bookmarks.filter(
      (item) => !("children" in item),
    ) as BookmarkUrlNode[]
    const rootFolders = bookmarks.filter(
      (item) => "children" in item,
    ) as BookmarkFolderNode[]

    // Build folder stack from IDs using fresh data
    const folderStack: BookmarkFolderNode[] = []
    let currentChildren: Bookmark[] = []
    let currentParentId: string | undefined = undefined

    if (folderIdStack.length === 0) {
      // We're in a root folder
      if (activeRootFolder === "home") {
        currentChildren = rootChildren
        currentParentId = general.rootFolder
      } else if (
        activeRootFolder !== "history" &&
        activeRootFolder !== "top-sites"
      ) {
        const rootFolder = rootFolders.find(
          (folder) => folder.id === activeRootFolder,
        )

        if (rootFolder) {
          currentChildren = rootFolder.children || []
          currentParentId = activeRootFolder
        }
      }
    } else {
      // We're in a nested folder - rebuild the path
      // Start with the current active root folder's children
      let currentSearchChildren: Bookmark[] = []

      if (activeRootFolder === "home") {
        currentSearchChildren = [...rootChildren, ...rootFolders]
      } else if (
        activeRootFolder !== "history" &&
        activeRootFolder !== "top-sites"
      ) {
        const activeFolder = rootFolders.find(
          (folder) => folder.id === activeRootFolder,
        )
        currentSearchChildren = activeFolder?.children || []
      }

      // Navigate through each folder in the stack
      for (let i = 0; i < folderIdStack.length; i++) {
        const folderId = folderIdStack[i]
        const foundFolder = currentSearchChildren.find(
          (child) => "children" in child && child.id === folderId,
        ) as BookmarkFolderNode

        if (foundFolder) {
          folderStack.push(foundFolder)
          // Update search space to this folder's children for next iteration
          currentSearchChildren = foundFolder.children || []
        } else {
          console.log(`Folder ${folderId} not found at level ${i}`)
          break
        }
      }

      // Set current children to the last valid folder's children
      if (folderStack.length > 0) {
        const lastFolder = folderStack[folderStack.length - 1]
        currentChildren = lastFolder.children || []
        currentParentId = lastFolder.id
      }
    }

    return {
      rootChildren,
      rootFolders,
      currentFolderChildren: currentChildren,
      currentParentId,
      folderStack,
    }
  }, [bookmarks, folderIdStack, activeRootFolder, general.rootFolder])

  // Clean up folder stack if folders were deleted
  useEffect(() => {
    if (folderIdStack.length > folderStack.length) {
      setFolderIdStack((prev) => prev.slice(0, folderStack.length))
    }
  }, [folderStack.length, folderIdStack.length])

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

    chrome.bookmarks.move(String(from), {
      index:
        fromCurrent.index > toCurrent.index
          ? toCurrent.index
          : toCurrent.index + 1,
    })
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
  })

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250, // 250ms hold before dragging
      tolerance: 10,
    },
  })

  const sensors = useSensors(mouseSensor, touchSensor)

  return (
    <DndContext onDragEnd={onDragEnd} sensors={sensors}>
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
      <div
        className={cn(
          "mb-6 col-span-6 h-[70vh] overflow-scroll __vivid_hide-scrollbar",
          theme === "light" ? "dark" : "light",
        )}
      >
        <div className="flex justify-between gap-6 mb-4">
          <div className="flex gap-2.5 flex-wrap ">
            {sortBookmarks(
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
                disableDragging={
                  item.id === "home" ||
                  item.id === "history" ||
                  item.id === "top-sites"
                }
                item={item}
                onClick={() => {
                  setActiveRootFolder(item.id)
                  setFolderIdStack([]) // Clear navigation stack
                  chrome.storage.sync.set({ activeRootFolder: item.id })
                }}
                activeRootFolder={activeRootFolder}
              />
            ))}
            <Button
              tabIndex={-1}
              size="sm"
              className="text-xs px-2.5 py-1 h-fit rounded-sm bg-muted/20 hover:bg-muted/30 text-accent-foreground"
              variant="ghost"
              onClick={() => {
                setIsCreateAFolderDialogOpen(true)
              }}
            >
              <PlusIcon className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2.5 bg-muted/20 rounded-sm px-2.5 py-1 h-fit">
            <button
              onClick={() => {
                setIsCreateAFolderDialogOpen(true)
              }}
              disabled={
                activeRootFolder === "history" ||
                activeRootFolder === "top-sites"
              }
              tabIndex={-1}
              className="disabled:opacity-50"
            >
              <FolderPlusIcon className="size-5 text-foreground" />
            </button>
            <button
              onClick={() => {
                setIsCreateABookmarkDialogOpen(true)
              }}
              disabled={
                activeRootFolder === "history" ||
                activeRootFolder === "top-sites"
              }
              tabIndex={-1}
              className="disabled:opacity-50"
            >
              <BookmarkPlusIcon className="size-5 text-foreground" />
            </button>
          </div>
        </div>
        <div className="bg-transparent">
          {folderIdStack.length > 0 && (
            <Button
              onClick={() => {
                setFolderIdStack((prev) => prev.slice(0, -1))
              }}
              variant="ghost"
              size="sm"
              className="text-xs hover:bg-transparent text-foreground"
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
                  key={i}
                  id={item.url}
                  title={item.title}
                  url={item.url}
                  layout={general.layout}
                  index={i}
                  dateAdded={0}
                  disableContextMenu={true}
                />
              ))
            ) : (
              sortBookmarks(currentFolderChildren)?.map((item) => {
                if ("children" in item) {
                  return (
                    <BookmarkFolder
                      {...item}
                      key={item.id}
                      layout={general.layout}
                      onOpenFolder={() => {
                        setFolderIdStack((prev) => [...prev, item.id])
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
              })
            )}
          </div>
        </div>
      </div>
    </DndContext>
  )
}

export { Bookmarks }
