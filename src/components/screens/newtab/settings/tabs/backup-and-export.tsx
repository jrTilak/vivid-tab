import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useBookmarks } from "@/hooks/use-bookmarks"
import { useSettings } from "@/providers/settings-provider"
import { SettingsSchema } from "@/zod/settings"
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

    const json = JSON.stringify(obj, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `vivid-tab-settings-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importSettings = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json,application/json"

    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement
      if (!target.files?.length) return

      const file = target.files[0]
      const reader = new FileReader()

      reader.onload = (ev: ProgressEvent<FileReader>) => {
        if (!ev.target?.result) return
        const json = ev.target.result as string

        try {
          const parsed = JSON.parse(json) as unknown
          const rawSettings =
            parsed &&
            typeof parsed === "object" &&
            "settings" in parsed &&
            (parsed as { settings: unknown }).settings !== undefined
              ? (parsed as { settings: unknown }).settings
              : parsed

          if (rawSettings === undefined || rawSettings === null) {
            window.alert("Invalid file: missing settings object")
            
            return
          }

          const result = SettingsSchema.safeParse(rawSettings)

          if (result.success) {
            setSettings(result.data)
            window.alert("Settings imported successfully.")
          } else {
            const msg = result.error.errors
              .map((err) => `${err.path.join(".")}: ${err.message}`)
              .slice(0, 3)
              .join("\n")
            window.alert(`Invalid settings:\n${msg}`)
          }
        } catch (err) {
          console.error("Import error:", err)
          window.alert("Invalid file: could not read or parse the file.")
        }
      }

      reader.onerror = () => {
        window.alert("Failed to read the file.")
      }

      reader.readAsText(file)
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
          Import <UploadIcon />
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
          Export <DownloadIcon />
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
