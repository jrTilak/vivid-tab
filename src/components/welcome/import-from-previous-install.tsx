import { NAMES } from "@/common/constants"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import useBookmarks from "@/hooks/use-bookmarks"
import b from "@/lib/bookmarks"
import { useSettings } from "@/providers/settings-provider"
import { ANIMATIONS, type Tab } from "@/tabs/welcome"
import type { Animation } from "@/tabs/welcome"
import type { Bookmark, Bookmarks } from "@/types/bookmark-types"
import {
  ChevronLeftIcon,
  ChevronRight,
  ChevronRightIcon,
  HistoryIcon,
  StarIcon
} from "lucide-react"
import { motion } from "motion/react"
import React, { useEffect, useState } from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../ui/select"

type Props = {
  scrollToTab: (tab: Tab) => void
  animation: Animation
  setAnimation: (animation: Animation) => void
}

const ImportFromPreviousInstall = ({
  scrollToTab,
  animation,
  setAnimation
}: Props) => {
  const [folders, setFolders] = useState<
    { bookmark: Bookmark; path: string }[]
  >([])
  const bookmarks = useBookmarks()
  const [selectedFolder, setSelectedFolder] = useState<string>("")
  const { setSettings } = useSettings()
  useEffect(() => {
    const folders = b.searchBookmarkFoldersByName(
      bookmarks,
      NAMES.DEFAULT_BOOKMARK_FOLDER_NAME
    )
    setFolders(folders)
  }, [bookmarks])

  return (
    <motion.div {...ANIMATIONS[animation]}>
      <Card className="w-full max-w-lg bg-background text-center min-w-[512px]">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Restore Bookmarks</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select the folder to restore your bookmarks.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <Select
              value={selectedFolder}
              disabled={folders.length === 0}
              onValueChange={(value) => setSelectedFolder(value)}>
              <SelectTrigger value={null}>
                <SelectValue
                  placeholder={
                    folders.length === 0
                      ? "We couldn't find the trace of your previous install"
                      : "Select folder"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {folders.map((folder) => (
                  <SelectItem key={folder.path} value={folder.bookmark.id}>
                    {folder.path}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="justify-between pt-6">
          <Button
            onClick={() => {
              scrollToTab("IMPORT")
              setAnimation("leftToRight")
            }}
            variant="ghost"
            size="sm">
            <ChevronLeftIcon className="mr-1 h-4 w-4" />
            BACK
          </Button>
          <Button
            disabled={!selectedFolder}
            onClick={() => {
              setSettings((prev) => ({
                ...prev,
                general: {
                  ...prev.general,
                  rootFolder: selectedFolder
                }
              }))
              chrome.tabs.discard()
              chrome.tabs.create({})
            }}
            variant="ghost"
            size="sm">
            FINISH
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

export default ImportFromPreviousInstall
