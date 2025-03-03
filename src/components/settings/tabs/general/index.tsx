import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useSettings } from "@/providers/settings-provider"
import { useTheme, type Theme } from "@/providers/theme-provider"
import React, { useCallback } from "react"
import useFlattenBookmarkFolders from "@/hooks/use-flatten-bookmark-folders"
import { HistoryIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

const GeneralSettings = () => {
  const folders = useFlattenBookmarkFolders()
  const {
    settings: {
      general: {
        showHistory,
        layout,
        openUrlIn,
        rootFolder,
        bookmarksCanTakeExtraSpaceIfAvailable,
        showTopSites,
      },
    },
    setSettings,
    resetSettings,
  } = useSettings()
  const { setTheme, theme } = useTheme()

  const handleSettingsChange = useCallback((key: string, value: unknown) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      general: {
        ...prevSettings.general,
        [key]: value,
      },
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
          onValueChange={(value) => setTheme(value as Theme)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select theme" />
          </SelectTrigger>
          <SelectContent>
            {(
              [
                {
                  label: "System",
                  value: "system",
                },
                {
                  label: "Light",
                  value: "light",
                },
                {
                  label: "Dark",
                  value: "dark",
                },
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
        <div className="w-[60%]">
          <Select
            value={rootFolder}
            disabled={folders.length === 0}
            onValueChange={(value) => {
              handleSettingsChange("rootFolder", value)
            }}
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
      </div>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Show History</Label>
        </div>
        <Switch
          checked={showHistory}
          onCheckedChange={(checked) =>
            handleSettingsChange("showHistory", checked)
          }
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Show Top Sites</Label>
        </div>
        <Switch
          checked={showTopSites}
          onCheckedChange={(checked) =>
            handleSettingsChange("showTopSites", checked)
          }
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <label className="text-sm font-medium">Layout</label>
        </div>
        <Select
          value={layout}
          onValueChange={(value) => handleSettingsChange("layout", value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select layout" />
          </SelectTrigger>
          <SelectContent>
            {(
              [
                {
                  label: "Grid",
                  value: "grid",
                },
                {
                  label: "List",
                  value: "list",
                },
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
          <label className="text-sm font-medium">Open URL in (shortcuts)</label>
        </div>
        <Select
          value={openUrlIn}
          onValueChange={(value) => handleSettingsChange("openUrlIn", value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select open URL in" />
          </SelectTrigger>
          <SelectContent>
            {(
              [
                {
                  label: "New Tab",
                  value: "new-tab",
                },
                {
                  label: "Current Tab",
                  value: "current-tab",
                },
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
          <Label className="text-sm font-medium">
            Bookmarks can take extra space if available
          </Label>
        </div>
        <Switch
          checked={bookmarksCanTakeExtraSpaceIfAvailable}
          onCheckedChange={(checked) =>
            handleSettingsChange(
              "bookmarksCanTakeExtraSpaceIfAvailable",
              checked,
            )
          }
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Reset Settings</Label>
        </div>
        <Button
          onClick={resetSettings}
          variant="outline"
          className="min-w-32 text-destructive"
        >
          Reset <HistoryIcon />
        </Button>
      </div>
    </div>
  )
}

export default GeneralSettings
