import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import tryCatchAsync from "@/lib/try-catch-async"
import useAsyncEffect from "@/hooks/use-async-effect"
import useUserLocation from "@/hooks/use-user-location"
import { useSettings } from "@/providers/settings-provider"
import { CloudIcon } from "lucide-react"
import React, { useState } from "react"

type WeatherData = {
  location: string
  temp: {
    celsius: number
    fahrenheit: number
  }
  condition: {
    text: string
    icon: string
  }
}

const Weather = () => {
  const [isLoading, setIsLoading] = useState(true)
  const {
    settings: { temperature },
  } = useSettings()
  const [weatherData, setWeatherData] = useState<WeatherData>()
  const [isError, setIsError] = useState({
    message: "",
    err: false,
  })

  const location = useUserLocation()

  useAsyncEffect(async () => {
    if (location.isLoading || location.error.err || isError.err) return

    // get the weather data from local storage
    const [localWeatherError, localWeatherData] = await tryCatchAsync(
      async () => {
        const data = await new Promise<
          WeatherData & {
            expires: number
          }
        >((resolve, reject) => {
          chrome.storage.local.get("weatherData", (data) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError)

              return
            }

            if (!data.weatherData) {
              reject(new Error("No data found"))

              return
            }

            try {
              const parsed = JSON.parse(data.weatherData)
              resolve(parsed)
            } catch {
              reject(new Error("Failed to parse data"))
            }
          })
        })

        if (!data || data.expires < Date.now()) throw new Error("No data found")

        return data
      },
    )

    if (!localWeatherError && localWeatherData) {
      setWeatherData(localWeatherData)
      setIsLoading(false)

      return
    }

    const key = process.env.PLASMO_PUBLIC_WEATHER_API_KEY
    const [error, data] = await tryCatchAsync(async () => {
      const res = await fetch(
        `http://api.weatherapi.com/v1/current.json?key=${key}&q=${location.position.lat},${location.position.lon}`,
      )
      if (!res.ok) throw new Error("Failed to fetch weather data")
      const data = await res.json()

      return {
        location: data.location.name + ", " + data.location.country,
        temp: {
          celsius: data.current.temp_c,
          fahrenheit: data.current.temp_f,
        },
        condition: data.current.condition,
      } as WeatherData
    })

    if (error) {
      setIsError({ message: error.message, err: true })
      setIsLoading(false)

      return
    }

    setIsLoading(false)
    setWeatherData(data)

    // save the weather data to local storage
    chrome.storage.local.set({
      weatherData: JSON.stringify({
        ...data,
        expires: Date.now() + 1000 * 60 * 60 * 2, // 2 hours
      }),
    })
  }, [location.isLoading, location.error.err, isError.err])

  if (isLoading) {
    return <Skeleton className="h-24" />
  }

  return (
    <Card className="p-6">
      {isError.err ? (
        <div className="flex space-x-2 text-destructive">
          <CloudIcon className="h-5 w-5" />
          <div className="text-base">{isError.message}</div>
        </div>
      ) : (
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
            <div className="text-xs text-gray-300">
              {weatherData.condition.text}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

export default Weather
