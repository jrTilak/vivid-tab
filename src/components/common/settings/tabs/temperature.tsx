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
import React, { useCallback } from "react"

type TemperatureUnit = SettingsConfig["temperature"]["unit"]

const TemperatureSetting = () => {
  const {
    settings: { temperature },
    setSettings
  } = useSettings()

  const handleSettingsChange = useCallback(
    (key: string, value: any) => {
      setSettings((prevSettings) => ({
        ...prevSettings,
        temperature: {
          ...prevSettings.temperature,
          [key]: value
        }
      }))
    },
    [temperature]
  )

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <label className="text-sm font-medium">Temperature unit</label>
        </div>
        <Select
          value={temperature.unit}
          onValueChange={(value) =>
            handleSettingsChange("unit", value as TemperatureUnit)
          }>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select temperature unit" />
          </SelectTrigger>
          <SelectContent>
            {(
              [
                {
                  label: "Celsius",
                  value: "celsius"
                },
                {
                  label: "Fahrenheit",
                  value: "fahrenheit"
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

export default TemperatureSetting
