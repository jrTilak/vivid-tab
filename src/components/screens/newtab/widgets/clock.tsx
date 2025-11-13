import { Card } from "@/components/ui/card"
import { useSettings } from "@/providers/settings-provider"
import React, { useEffect, useState } from "react"

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

    let hours: number = date.getHours()
    const minutes: string = date.getMinutes().toString().padStart(2, "0")
    const seconds: string = date.getSeconds().toString().padStart(2, "0")

    let timeString: string = ""
    let ampm: string = ""

    if (timer.timeFormat === "12h") {
      ampm = hours >= 12 ? " PM" : " AM"
      hours = hours % 12
      hours = hours ? hours : 12 // 0 should be 12

      // For 12h format: h:mm (no leading zero) vs hh:mm (with leading zero)
      const formattedHours: string = timer.showSeconds
        ? hours.toString()
        : hours.toString().padStart(2, "0")
      timeString = `${formattedHours}:${minutes}`
    } else {
      // 24h format: H:mm (no leading zero) vs HH:mm (with leading zero)
      const formattedHours: string = timer.showSeconds
        ? hours.toString()
        : hours.toString().padStart(2, "0")
      timeString = `${formattedHours}:${minutes}`
    }

    if (timer.showSeconds) {
      timeString += `:${seconds}`
    }

    return timeString + ampm
  }

  const formatDate = (date: Date): string => {
    const days: readonly string[] = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ] as const

    const months: readonly string[] = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ] as const

    const dayName: string = days[date.getDay()]
    const monthName: string = months[date.getMonth()]
    const dayNumber: number = date.getDate()

    return `${dayName}, ${monthName} ${dayNumber}`
  }

  return (
    <Card className="p-6">
      <div className="text-5xl font-light">{formatTime(time, timer)}</div>
      <div className="mt-1 text-sm">{formatDate(time)}</div>
    </Card>
  )
}

export { Clock }
