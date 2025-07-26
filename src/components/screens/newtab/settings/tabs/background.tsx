import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { useSettings } from "@/providers/settings-provider"
import React, { useCallback } from "react"

const BackgroundSetting = () => {
  const {
    settings: { background },
    setSettings,
  } = useSettings()

  const handleSettingsChange = useCallback(
    (key: string, value: unknown) => {
      setSettings((prevSettings) => ({
        ...prevSettings,
        background: {
          ...prevSettings.background,
          [key]: value,
        },
      }))
    },
    [background],
  )

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5 min-w-fit">
          <Label className="text-sm font-medium">Background Blur Intensity ({background.blurIntensity}px)</Label>
        </div>
        <Slider
          min={0}
          max={10}
          step={1}
          className="w-[200px]"
          defaultValue={[background.blurIntensity]}
          onValueCommit={(value) => {
            handleSettingsChange("blurIntensity", value[0])
          }}
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5 min-w-fit">
          <Label className="text-sm font-medium">Background Brightness ({(((background.brightness) / 10)).toFixed(1)}%)</Label>
        </div>
        <Slider
          min={0}
          max={10}
          step={1}
          className="w-[200px]"
          defaultValue={[background.brightness]}
          onValueCommit={(value) => {
            handleSettingsChange("brightness", value[0])
          }}
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <label className="text-sm font-medium">Randomize Wallpaper</label>
        </div>
        <Select
          value={background.randomizeWallpaper}
          onValueChange={(value) =>
            handleSettingsChange("randomizeWallpaper", value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select randomize wallpaper option" />
          </SelectTrigger>
          <SelectContent>
            {(
              [
                {
                  label: "Off",
                  value: "off",
                },
                {
                  label: "On Each Tab",
                  value: "on-each-tab",
                },
                {
                  label: "Hourly",
                  value: "hourly",
                },
                {
                  label: "Daily",
                  value: "daily",
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
    </div>
  )
}

export default BackgroundSetting
