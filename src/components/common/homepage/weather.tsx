import { Card } from '@/components/ui/card'
import { CloudIcon } from 'lucide-react'
import React from 'react'

const Weather = () => {
  return (
    <Card className="p-6">
      <div className="flex items-center space-x-3">
        <CloudIcon className="h-8 w-8" />
        <div>
          <div className="text-2xl">10°C</div>
          <div className="text-sm">San Francisco</div>
          <div className="text-xs text-gray-300">Few clouds</div>
        </div>
      </div>
    </Card>
  )
}

export default Weather