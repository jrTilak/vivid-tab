import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useSettings } from "@/providers/settings-provider"
import { ANIMATIONS } from "@/tabs/welcome"

import { ChevronLeftIcon, ChevronRight } from "lucide-react"
import { motion } from "motion/react"
import React, { useState } from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import useActiveTab from "@/hooks/use-active-tab"
import useFlattenBookmarkFolders from "@/hooks/use-flatten-bookmark-folders"
import type { Props } from "."

const ImportFromBrowserBookmarks = ({
  scrollToTab,
  animation,
  setAnimation,
}: Props) => {
  const folders = useFlattenBookmarkFolders()
  const [selectedFolder, setSelectedFolder] = useState<string>("")
  const { setSettings } = useSettings()
  const activeTabId = useActiveTab()

  return (
    <motion.div {...ANIMATIONS[animation]}>
      <Card className="w-full max-w-lg bg-background text-center min-w-[512px]">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            Import from browser bookmarks
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Select the folder to save as vivid bookmarks
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <Select
              value={selectedFolder}
              disabled={folders.length === 0}
              onValueChange={(value) => setSelectedFolder(value)}
            >
              <SelectTrigger value={null}>
                <SelectValue
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
              setAnimation("leftToRight")
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

export default ImportFromBrowserBookmarks
