import { Card } from "@/components/ui/card"
import { useSettings } from "@/providers/settings-provider"
import React, { useEffect, useState } from "react"
import { format } from "date-fns"

const Clock = () => {
  const {
    settings: { timer },
  } = useSettings()
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <Card className="p-6">
      <div className="text-5xl font-light">
        {format(
          time,
          timer.showSeconds
            ? timer.timeFormat === "12h"
              ? "h:mm:ss aa"
              : "H:mm:ss"
            : timer.timeFormat === "12h"
              ? "hh:mm aa"
              : "HH:mm",
        )}
      </div>
      <div className="mt-1 text-sm">{format(time, "EEEE, MMMM d")}</div>
    </Card>
  )
}

export { Clock }
