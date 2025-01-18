import { Card } from '@/components/ui/card'
import React, { useEffect, useState } from 'react'

const Clock = () => {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <Card className="p-6">
      <div className="text-5xl font-light">
        {time.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
      <div className="mt-1 text-sm">
        {time.toLocaleDateString([], {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      </div>
    </Card>
  )
}

export default Clock