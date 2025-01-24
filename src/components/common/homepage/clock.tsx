import { Card } from '@/components/ui/card'
import dateFns from '@/helpers/date-fns'
import { useSettings } from '@/providers/settings-provider'
import React, { useEffect, useState } from 'react'

const Clock = () => {
  const { settings: { timer } } = useSettings()
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <Card className="p-6">
      <div className="text-5xl font-light">
        {dateFns.formatTime(time, {
          hour12: timer.timeFormat === "12h",
          showSeconds: timer.showSeconds,
        })}
      </div>
      <div className="mt-1 text-sm">
        {dateFns.formatDate(time)}
      </div>
    </Card>
  )
}

export default Clock