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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useFlattenBookmarkFolders } from "@/hooks/use-flatten-bookmark-folders"
import { useBrowserActiveTab } from "@/hooks/use-browser-active-tab"
import { ANIMATION_PROPS } from "@/constants/animations"
import { useWelcomeContext } from "./_context"

const ImportFromBrowserBookmarks = () => {
  const folders = useFlattenBookmarkFolders()
  const [selectedFolder, setSelectedFolder] = useState<string>("")
  const { setSettings } = useSettings()
  const activeTabId = useBrowserActiveTab()
  const { animationName, setAnimationName, scrollToTab } = useWelcomeContext()

  return (
    <motion.div {...ANIMATION_PROPS[animationName]}>
      <Card className="w-full max-w-lg text-center min-w-lg text-foreground pt-12 gap-4">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            Import from browser bookmarks
          </CardTitle>
          <p className="text-sm">
            Select the folder to save as vivid bookmarks
          </p>
        </CardHeader>
        <CardContent className="space-y-4 pb-6">
          <div className="flex items-center justify-between gap-2">
            <Select
              value={selectedFolder}
              disabled={folders.length === 0}
              onValueChange={(value) => setSelectedFolder(value)}
            >
              <SelectTrigger value={null} className="bg-background/20">
                <SelectValue
                  className="select-none"
                  placeholder={
                    folders.length === 0
                      ? "No browser bookmarks found"
                      : "Select folder"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    <span
                      style={{
                        paddingLeft: folder.depth * 10,
                      }}
                    >
                      {folder.title}
                    </span>
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
              setAnimationName("leftToRight")
            }}
            variant="ghost"
            size="sm"
          >
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
                  rootFolder: selectedFolder,
                },
              }))
              chrome.tabs.create({})
              chrome.tabs.remove(activeTabId)
            }}
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

export { ImportFromBrowserBookmarks }
