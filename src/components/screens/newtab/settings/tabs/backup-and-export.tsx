import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useBookmarks } from "@/hooks/use-bookmarks"
import { useSettings } from "@/providers/settings-provider"
import { SettingsSchema, SettingsSchemaForImport } from "@/zod/settings"
import { DownloadIcon, UploadIcon } from "lucide-react"
import React from "react"

const BackupAndExportSettings = () => {
  const { settings, setSettings } = useSettings()
  const bookmarks = useBookmarks(settings.general.rootFolder)

  const exportSettings = (includeBookmarks: boolean) => {
    const obj = {
      settings,
      bookmarks: includeBookmarks ? bookmarks : undefined,
    }

    // download the file
    const json = JSON.stringify(obj)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "settings.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const importSettings = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"

    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement
      if (!target.files?.length) return

      const file = target.files[0]
      const reader = new FileReader()
      reader.readAsText(file)

      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (!e.target?.result) return
        const json = e.target.result as string

        const { success, data } = SettingsSchemaForImport.safeParse(
          JSON.parse(json).settings,
        )

        if (!success) {
          window.alert("Invalid settings, please check your file")
        } else {
          setSettings(SettingsSchema.parse(data))
        }
      }
    }

    input.click()
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5 min-w-fit">
          <Label className="text-sm font-medium">Import Settings</Label>
        </div>
        <Button onClick={importSettings} variant="outline" className="min-w-32">
          Import <DownloadIcon />
        </Button>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5 min-w-fit">
          <Label className="text-sm font-medium">Export Settings</Label>
        </div>
        <Button
          onClick={() => exportSettings(false)}
          variant="outline"
          className="min-w-32"
        >
          Export <UploadIcon />
        </Button>
      </div>

      {/* <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5 min-w-fit">
          <Label className="text-sm font-medium">Export Settings (with bookmarks)</Label>
        </div>
        <Button
          onClick={() => exportSettings(true)}
          variant="outline" className="min-w-32">
          Export <UploadIcon />
        </Button>
      </div> */}
    </div>
  )
}

export default BackupAndExportSettings
