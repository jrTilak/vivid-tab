import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useSettings } from "@/providers/settings-provider"
import type { SettingsConfig } from "@/types/setting-types"
import { capitalCase } from "change-case"
import React, { useCallback } from "react"

type TimeFormat = SettingsConfig["timer"]["timeFormat"]

const TimerSettings = () => {
  const {
    settings: { timer },
    setSettings
  } = useSettings()

  const handleSettingsChange = useCallback(
    (key: string, value: any) => {
      setSettings((prevSettings) => ({
        ...prevSettings,
        timer: {
          ...prevSettings.timer,
          [key]: value
        }
      }))
    },
    [timer]
  )

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <label className="text-sm font-medium">Time format</label>
        </div>
        <Select
          value={timer.timeFormat}
          onValueChange={(value) =>
            handleSettingsChange("timeFormat", value as TimeFormat)
          }>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select format" />
          </SelectTrigger>
          <SelectContent>
            {(
              [
                {
                  label: "12-Hour",
                  value: "12h"
                },
                {
                  label: "24-Hour",
                  value: "24h"
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
          <Label className="text-sm font-medium">Show seconds</Label>
        </div>
        <Switch
          checked={timer.showSeconds}
          onCheckedChange={(checked) =>
            handleSettingsChange("showSeconds", checked)
          }
        />
      </div>
    </div>
  )
}

export default TimerSettings
