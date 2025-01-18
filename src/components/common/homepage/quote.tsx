import { Card } from '@/components/ui/card'
import React from 'react'

const Quote = () => {
  return (
    <Card className=" p-6">
      <blockquote className="space-y-2">
        <p className="text-sm italic">
          "Always do what you are afraid to do."
        </p>
        <footer className="text-xs">— Ralph Waldo Emerson</footer>
      </blockquote>
    </Card>
  )
}

export default Quote