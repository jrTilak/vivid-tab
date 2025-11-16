import { Card } from "@/components/ui/card"
import { useSettings } from "@/providers/settings-provider"
import React, { useEffect, useState } from "react"
import { formatDate } from "date-fns"

interface TimerSettings {
  showSeconds?: boolean
  timeFormat?: "12h" | "24h"
}

const Clock = () => {
  const {
    settings: { timer },
  } = useSettings()
  const [time, setTime] = useState<Date>(new Date())

  useEffect(() => {
    const intervalId: NodeJS.Timeout = setInterval(
      () => setTime(new Date()),
      1000,
    )

    return () => clearInterval(intervalId)
  }, [])

  const formatTime = (date: Date, timer?: TimerSettings): string => {
    if (!timer) return "00:00"

    if (timer.timeFormat === "12h" && timer.showSeconds) {
      return formatDate(date, "hh:mm:ss a")
    } else if (timer.timeFormat === "24h" && timer.showSeconds) {
      return formatDate(date, "HH:mm:ss")
    } else if (timer.timeFormat === "12h") {
      return formatDate(date, "hh:mm a")
    } else if (timer.timeFormat === "24h") {
      return formatDate(date, "HH:mm")
    }
  }

  return (
    <Card className="p-6">
      <div className="text-5xl font-light">{formatTime(time, timer)}</div>
      <div className="mt-1 text-sm">{formatDate(time, "eeee dd, MMMM")}</div>
    </Card>
  )
}

export { Clock }
