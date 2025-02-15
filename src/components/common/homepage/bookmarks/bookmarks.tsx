import { Button } from "@/components/ui/button"
import { cn } from "@/helpers/cn"
import useBookmarks from "@/hooks/use-bookmarks"
import useHistory from "@/hooks/use-history"
import { useSettings } from "@/providers/settings-provider"
import type {
  Bookmark,
  BookmarkFolderNode,
  BookmarkUrlNode
} from "@/types/bookmark-types"
import { ArrowLeftIcon } from "lucide-react"
import React, { useEffect } from "react"

import BookmarkFolder from "./folder"
import BookmarkUrl from "./url"

const Bookmarks = () => {
  const [activeRootFolder, setActiveRootFolder] = React.useState("home")
  const [rootChildren, setRootChildren] = React.useState<BookmarkUrlNode[]>([])
  const [rootFolders, setRootFolders] = React.useState<BookmarkFolderNode[]>([])
  const [folderStack, setFolderStack] = React.useState<Bookmark[]>([])
  const history = useHistory()
  const {
    settings: { general }
  } = useSettings()
  const bookmarks = useBookmarks(general.rootFolder)

  useEffect(() => {
    if (bookmarks.length) {
      setRootChildren(
        bookmarks.filter((item) => !("children" in item)) as BookmarkUrlNode[]
      )
      setRootFolders(
        bookmarks.filter((item) => "children" in item) as BookmarkFolderNode[]
      )
    }
  }, [bookmarks])

  return (
    <div className="mb-6 col-span-6 h-[70vh] overflow-scroll">
      <div className="flex gap-2.5 flex-wrap mb-4">
        {[
          {
            id: "home",
            label: "Home"
          },
          ...rootFolders.map((folder) => ({
            id: folder.id,
            label: folder.title,
            ...folder
          })),
          {
            id: "history",
            label: "History"
          }
        ].map((item) => (
          <Button
            key={item.id}
            onClick={() => {
              setActiveRootFolder(item.id)
              setFolderStack([])
            }}
            variant={activeRootFolder === item.id ? "default" : "ghost"}
            size="sm"
            className={cn(
              "text-xs px-2.5 py-1 h-fit rounded-sm",
              activeRootFolder !== item.id && "bg-muted/20 hover:bg-muted/30"
            )}>
            {item.label}
          </Button>
        ))}
      </div>
      <div className="bg-transparent">
        {folderStack.length > 0 && (
          <Button
            onClick={() => setFolderStack((prev) => prev.slice(0, -1))}
            variant="ghost"
            size="sm"
            className="text-xs hover:bg-transparent">
            <ArrowLeftIcon className="h-4 w-4" />
            Back
          </Button>
        )}
        <div
          className={cn(
            general.layout === "grid"
              ? "grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-4"
              : "grid grid-cols-2 xl:grid-cols-3 gap-4",
            "bg-black/20 backdrop-blur-[1px] rounded-lg p-2 min-h-[300px]"
          )}>
          {activeRootFolder === "home" ? (
            rootChildren.map((item) => (
              <BookmarkUrl {...item} key={item.id} layout={general.layout} />
            ))
          ) : activeRootFolder === "history" ? (
            history.map((item) => (
              <BookmarkUrl
                {...item}
                key={item.id}
                layout={general.layout}
                dateAdded={item.lastVisitTime}
              />
            ))
          ) : (
            (folderStack?.length > 0
              ? folderStack[folderStack.length - 1] as BookmarkFolderNode
              : rootFolders?.find((folder) => folder.id === activeRootFolder))
              ?.children?.map((item) => {
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
              })
          )}
        </div>
      </div>
    </div>
  )
}

export default Bookmarks
