import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useFetchWeather } from "@/hooks/use-fetch-weather"
import { useSettings } from "@/providers/settings-provider"
import React from "react"

const Weather = () => {
  const { isLoading, error, weatherData, } = useFetchWeather()
  const { settings: { temperature } } = useSettings()

  if (error.err) return null

  if (isLoading) {
    return <Skeleton className="h-24" />
  }

  return (
    <Card className="p-6">
      {
        <div className="flex space-x-3">
          <img
            src={
              weatherData.condition.icon.startsWith("http")
                ? weatherData.condition.icon
                : `https:${weatherData.condition.icon}`
            }
            alt="weather icon"
            className="h-8 w-8 mt-1"
          />
          <div>
            <div className="text-2xl">
              {temperature.unit === "celsius"
                ? `${weatherData.temp.celsius}°C`
                : `${weatherData.temp.fahrenheit}°F`}
            </div>
            <div className="text-sm">{weatherData.location}</div>
            <div className="text-xs text-muted-foreground">
              {weatherData.condition.text}
            </div>
          </div>
        </div>
      }
    </Card>
  )
}

export { Weather }
