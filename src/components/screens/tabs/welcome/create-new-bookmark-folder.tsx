import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useSettings } from "@/providers/settings-provider"
import { ChevronLeftIcon, ChevronRight } from "lucide-react"
import { motion } from "motion/react"
import React, { useState } from "react"

import { Input } from "@/components/ui/input"
import { useBrowserActiveTab } from "@/hooks/use-browser-active-tab"
import { ANIMATION_PROPS } from "@/constants/animations"
import { useWelcomeContext } from "./_context"
import { DEFAULT_BOOKMARK_FOLDER_NAME } from "@/constants/keys"

const CreateNewBookmarkFolder = () => {
  const [bookmarkFolderName, setBookmarkFolderName] = useState(
    DEFAULT_BOOKMARK_FOLDER_NAME,
  )
  const { setSettings } = useSettings()
  const activeTabId = useBrowserActiveTab()
  const { animationName, scrollToTab, setAnimationName } = useWelcomeContext()

  const onCreate = async () => {
    const bookmark = await chrome.bookmarks.create({
      title: bookmarkFolderName,
    })

    setSettings((prev) => ({
      ...prev,
      general: {
        ...prev.general,
        rootFolder: bookmark.id,
      },
    }))
    chrome.tabs.create({})
    chrome.tabs.remove(activeTabId)
  }

  return (
    <motion.div {...ANIMATION_PROPS[animationName]}>
      <Card className="w-full max-w-lg text-center min-w-lg text-foreground gap-4">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create Bookmark Folder</CardTitle>
          <p className="text-sm">
            After creating a folder, you can add bookmarks to{" "}
            {bookmarkFolderName} folder and it will automatically appear in the
            vivid-tab page
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <Input
              className="bg-background/30"
              value={bookmarkFolderName}
              onChange={(e) => setBookmarkFolderName(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="justify-between pt-6">
          <Button
            onClick={() => {
              scrollToTab("IMPORT")
              setAnimationName("leftToRight")
            }}
            variant="ghost"
            size="sm"
          >
            <ChevronLeftIcon className="mr-1 h-4 w-4" />
            BACK
          </Button>
          <Button
            disabled={!bookmarkFolderName}
            onClick={onCreate}
            variant="ghost"
            size="sm"
          >
            FINISH
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

export { CreateNewBookmarkFolder }
