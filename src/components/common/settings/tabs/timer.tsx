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
import { Input } from '@/components/ui/input'
import { TIMER_POSITIONS } from '@/common/settings'
import { capitalCase } from 'change-case'

type TimeFormat = SettingsConfig["timer"]["timeFormat"]

const TimerSettings = () => {
  const { settings: { timer }, setSettings } = useSettings()


  const handleSettingsChange = useCallback((key: string, value: any) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      timer: {
        ...timer,
        [key]: value
      }
    }))
  }, [setSettings, timer])

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">
            Show Timer
          </Label>
        </div>
        <Switch
          checked={timer.showTimer}
          onCheckedChange={(checked) => handleSettingsChange("showTimer", checked)}
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <label className="text-sm font-medium">Time format</label>
        </div>
        <Select
          disabled={!timer.showTimer}
          value={timer.timeFormat}
          onValueChange={(value) => handleSettingsChange("timeFormat", value as TimeFormat)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select format" />
          </SelectTrigger>
          <SelectContent>
            {
              ([
                {
                  label: "12-Hour",
                  value: "12h"

                },
                {
                  label: "24-Hour",
                  value: "24h"

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
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <label className="text-sm font-medium">Time format</label>
        </div>
        <Select
          disabled={!timer.position}
          value={timer.position}
          onValueChange={(value) => handleSettingsChange("position", value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select format" />
          </SelectTrigger>
          <SelectContent>
            {
              (Object.values(TIMER_POSITIONS)).map((val) => (
                <SelectItem key={val} value={val}>
                  {capitalCase(val)}
                </SelectItem>
              ))
            }
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">
            Show seconds
          </Label>
        </div>
        <Switch
          disabled={!timer.showTimer}
          checked={timer.showSeconds}
          onCheckedChange={(checked) => handleSettingsChange("showSeconds", checked)}
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">
            Show Greetings
          </Label>
        </div>
        <Switch
          checked={timer.showGreetings}
          onCheckedChange={(checked) => handleSettingsChange("showGreetings", checked)}
        />
      </div>
      <Input
        disabled={!timer.showGreetings}
        placeholder="Greetings Text"
        value={timer.greetingsText}
        onChange={(e) => handleSettingsChange("greetingsText", e.target.value)}
      />
    </div>
  )
}

export default TimerSettings