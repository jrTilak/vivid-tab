import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/helpers/cn"
import { useSettings } from "@/providers/settings-provider"
import type {
  BookmarkFolderNode,
  BookmarkUrlNode
} from "@/types/bookmark-types"
import {
  ArrowLeftIcon,
} from "lucide-react"
import React, { useEffect } from "react"

import BookmarkFolder from "./folder"
import BookmarkUrl from "./url"
import { useBookmarkFolderNavigation } from "@/hooks/use-bookmarks-folder-navigation"
import { ScrollArea } from "@/components/ui/scroll-area"

const Bookmarks = () => {
  const [activeRootFolder, setActiveRootFolder] = React.useState("home")
  const {
    settings: { general }
  } = useSettings()

  const { currentFolders, folderPath, goBack, openFolder } = useBookmarkFolderNavigation(general.rootFolder)


  return (
    <div className="mb-6 col-span-6 h-[70vh] overflow-scroll">
      {/* <Tabs
        value={activeRootFolder}
        onValueChange={(value) => {
          if (value === "more") return
          setActiveRootFolder(value)
        }}>
        <TabsList className="w-full flex gap-2.5 flex-wrap items-start justify-start bg-transparent">
          <TabsTrigger value="home" className="text-sm">
            {[{ title: "Home" }, ...folderPath].map((folder) => folder.title).join(" / ")}
          </TabsTrigger> */}
      {/* {history?.length > 0 && general.showHistory && (
            <TabsTrigger value="history" className="text-sm">
              History
            </TabsTrigger>
          )} */}
      {/* {rootFolders.map((folder, index) => (
            <TabsTrigger key={index} value={folder.id} className="text-sm">
              {folder.title}
            </TabsTrigger>
          ))} */}
      {/* <TabsTrigger
            value="more"
            onClick={() => console.log("add folder")}
            className="text-sm">
            <PlusIcon className="h-4 w-4" />
          </TabsTrigger> */}
      {/* </TabsList> */}
      <div className="mt-5 bg-transparent">
        {folderPath.length > 0 && (
          <Button
            onClick={() => goBack()}
            variant="ghost"
            size="sm"
            className="text-xs hover:bg-transparent">
            <ArrowLeftIcon className="h-4 w-4" />
            Back
          </Button>
        )}
        <div className={cn(general.layout === "grid" ? "grid grid-cols-6 sm:grid-cols-7 gap-4" : "grid grid-cols-2 xl:grid-cols-3 gap-4")}>
          {currentFolders?.map((content, index) => {
            if ((content as BookmarkFolderNode).children) {
              return <BookmarkFolder {...content} key={index} onOpenFolder={() => {
                openFolder(content as BookmarkFolderNode)
              }}
                layout={general.layout}
              />
            } else {
              return (
                <BookmarkUrl {...(content as BookmarkUrlNode)} key={index} layout={general.layout} />
              )
            }
          })}
        </div>
      </div>
      {/* </Tabs> */}
    </div >
  )
}

export default Bookmarks
