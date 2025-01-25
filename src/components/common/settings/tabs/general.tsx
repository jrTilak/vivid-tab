import React, { useCallback } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useSettings } from '@/providers/settings-provider'
import type { SettingsConfig } from '@/types/setting-types'
import { Label } from '@/components/ui/label'
import { useTheme, type Theme } from '@/providers/theme-provider'


const GeneralSettings = () => {
  const { settings: { timer }, setSettings } = useSettings()
  const { setTheme, theme } = useTheme()


  const handleSettingsChange = useCallback((key: string, value: any) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      timer: {
        ...prevSettings.timer,
        [key]: value
      }
    }))
  }, [timer])

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
            {
              ([
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
              ] as const).map(({ label, value }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))
            }
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export default GeneralSettings