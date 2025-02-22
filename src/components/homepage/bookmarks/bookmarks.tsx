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
import { ArrowLeftIcon, BookmarkPlusIcon, FolderPlusIcon, PlusIcon } from "lucide-react"
import React, { useEffect, useState } from "react"

import BookmarkFolder from "./folder"
import BookmarkUrl from "./url"
import CreateAFolder from "./create-a-folder"
import CreateABookmark from "./create-a-bookmark"

const Bookmarks = () => {
  const [activeRootFolder, setActiveRootFolder] = React.useState("home")
  const [rootChildren, setRootChildren] = React.useState<BookmarkUrlNode[]>([])
  const [rootFolders, setRootFolders] = React.useState<BookmarkFolderNode[]>([])
  const [folderStack, setFolderStack] = React.useState<Bookmark[]>([])
  const history = useHistory()

  const {
    settings: { general, },
  } = useSettings()
  const bookmarks = useBookmarks(general.rootFolder)
  const [createAFolderId, setCreateAFolderId] = useState<string | undefined>(general.rootFolder)
  const [isCreateABookmarkDialogOpen, setIsCreateABookmarkDialogOpen] = useState(false)
  const [isCreateAFolderDialogOpen, setIsCreateAFolderDialogOpen] = useState(false)
  const [createFolderParentId, setCreateFolderParentId] = useState("")

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
    if (rootChildren.length === 0 && rootFolders.length > 0) {
      setActiveRootFolder(rootFolders[0].id)
    }
  }, [rootChildren, rootFolders])

  useEffect(() => {
    if (activeRootFolder !== "history") {
      setCreateAFolderId(activeRootFolder === "home" ? general.rootFolder : activeRootFolder)
    }
  }, [activeRootFolder])

  return (
    <>
      <CreateABookmark parentId={createAFolderId} open={isCreateABookmarkDialogOpen} setOpen={setIsCreateABookmarkDialogOpen} />
      <CreateAFolder parentId={createFolderParentId} open={isCreateAFolderDialogOpen} setOpen={setIsCreateAFolderDialogOpen} />

      <div className="mb-6 col-span-6 h-[70vh] overflow-scroll">
        <div className="flex justify-between gap-6 mb-4">
          <div className="flex gap-2.5 flex-wrap ">
            {[
              rootChildren.length > 0 && {
                id: "home",
                label: "Home",
              },
              ...rootFolders.map((folder) => ({
                id: folder.id,
                label: folder.title,
                ...folder,
              })),
              general.showHistory && {
                id: "history",
                label: "History",
              },
            ]
              .filter(Boolean)
              .map((item) => (
                <Button
                  key={item.id}
                  onClick={() => {
                    setActiveRootFolder(item.id)
                    setFolderStack([])

                  }}
                  onFocusCapture={() => {
                    setActiveRootFolder(item.id)
                    setFolderStack([])

                  }}
                  variant={activeRootFolder === item.id ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "text-xs px-2.5 py-1 h-fit rounded-sm",
                    activeRootFolder !== item.id && "bg-muted/20 hover:bg-muted/30",
                  )}
                >
                  {item.label}
                </Button>
              ))}
            <Button
              tabIndex={-1}
              size="sm"
              className="text-xs px-2.5 py-1 h-fit rounded-sm bg-muted/20 hover:bg-muted/30"
              variant="ghost"
              onClick={() => {
                setIsCreateAFolderDialogOpen(true)
                setCreateFolderParentId(general.rootFolder)
              }}
            >
              <PlusIcon className="h-4 w-4" />

            </Button>
          </div>
          <div
            className="flex gap-2.5 bg-muted/20 rounded-sm px-2.5 py-1"
          >
            <button
              onClick={() => {
                setIsCreateAFolderDialogOpen(true)
                setCreateFolderParentId(createAFolderId)
              }}
              disabled={activeRootFolder === "history"} tabIndex={-1} className="disabled:opacity-50">
              <FolderPlusIcon className="size-5 text-foreground" />
            </button>
            <button
              onClick={() => { setIsCreateABookmarkDialogOpen(true) }}
              disabled={activeRootFolder === "history"} tabIndex={-1} className="disabled:opacity-50">
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
              ? rootChildren.map((item) => (
                <BookmarkUrl {...item} key={item.id} layout={general.layout} />
              ))
              : activeRootFolder === "history"
                ? history.map((item) => (
                  <BookmarkUrl
                    {...item}
                    key={item.id}
                    layout={general.layout}
                    dateAdded={item.lastVisitTime}
                    disableContextMenu={activeRootFolder === "history"}
                  />
                ))
                : (folderStack?.length > 0
                  ? (folderStack[folderStack.length - 1] as BookmarkFolderNode)
                  : rootFolders?.find(
                    (folder) => folder.id === activeRootFolder,
                  )
                )?.children?.map((item) => {
                  if ("children" in item) {
                    return (
                      <BookmarkFolder
                        {...item}
                        key={item.id}
                        layout={general.layout}
                        onOpenFolder={() => {
                          setFolderStack((prev) => [...prev, item])
                        }}
                      />
                    )
                  } else {
                    return (
                      <BookmarkUrl
                        {...(item as BookmarkUrlNode)}
                        key={item.id}
                        layout={general.layout}
                      />
                    )
                  }
                })}
          </div>
        </div>
      </div>
    </>
  )
}

export default Bookmarks
