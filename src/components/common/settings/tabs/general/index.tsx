import { BACKGROUND_ACTIONS } from "@/common/constants"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import getBookmarkFolder from "@/helpers/get-bookmark-folder"
import useBookmarks from "@/hooks/use-bookmarks"
import { useSettings } from "@/providers/settings-provider"
import { useTheme, type Theme } from "@/providers/theme-provider"
import type { BookmarkFolderNode, Bookmarks } from "@/types/bookmark-types"
import React, { useCallback, useEffect, useState } from "react"

import { ChooseBookmarkFolder } from "./choose-bookmar-folder"

const GeneralSettings = () => {
  const {
    settings: {
      general: { rootFolder, showHistory, layout }
    },
    setSettings
  } = useSettings()
  const { setTheme, theme } = useTheme()
  const bookmarks = useBookmarks()

  const handleSettingsChange = useCallback((key: string, value: any) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      general: {
        ...prevSettings.general,
        [key]: value
      }
    }))
  }, [])

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <label className="text-sm font-medium">Theme</label>
        </div>
        <Select
          value={theme}
          onValueChange={(value) => setTheme(value as Theme)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select theme" />
          </SelectTrigger>
          <SelectContent>
            {(
              [
                {
                  label: "System",
                  value: "system"
                },
                {
                  label: "Light",
                  value: "light"
                },
                {
                  label: "Dark",
                  value: "dark"
                }
              ] as const
            ).map(({ label, value }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <label className="text-sm font-medium">Root Folder</label>
        </div>
        <div>
          <span className="mr-2">
            {" "}
            ({getBookmarkFolder(bookmarks, rootFolder)?.title})
          </span>
          <ChooseBookmarkFolder />
        </div>
      </div>
      {/* <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Show History</Label>
        </div>
        <Switch
          checked={showHistory}
          onCheckedChange={(checked) =>
            handleSettingsChange("showHistory", checked)
          }
        />
      </div> */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <label className="text-sm font-medium">Layout</label>
        </div>
        <Select
          value={layout}
          onValueChange={(value) => handleSettingsChange("layout", value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select layout" />
          </SelectTrigger>
          <SelectContent>
            {(
              [
                {
                  label: "Grid",
                  value: "grid"
                },
                {
                  label: "List",
                  value: "list"
                }
              ] as const
            ).map(({ label, value }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export default GeneralSettings
