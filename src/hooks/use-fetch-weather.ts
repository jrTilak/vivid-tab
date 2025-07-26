import { useState } from "react"

import { useAsyncEffect } from "./use-async-effect"
import { useIsOnline } from "./use-is-online"
import { tryCatchAsync } from "@/lib/try-catch-async"
import { LOCAL_STORAGE } from "@/constants/keys"

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

type CachedWeatherData = WeatherData & {
  expires: number
}

const useFetchWeather = () => {
  const [isLoading, setIsLoading] = useState(true)
  const isOnline = useIsOnline()
  const [weatherData, setWeatherData] = useState<WeatherData>()

  const [error, setError] = useState({
    message: "",
    err: false,
  })

  // Helper function to get cached weather data
  const getCachedWeatherData = async (): Promise<CachedWeatherData | null> => {
    const [, cachedData] = await tryCatchAsync(async () => {
      return new Promise<CachedWeatherData>((resolve, reject) => {
        chrome.storage.local.get(LOCAL_STORAGE.weather, (data) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError)

            return
          }

          if (!data || !data[LOCAL_STORAGE.weather]) {
            reject(new Error("No cached data found"))

            return
          }

          try {
            const parsed = JSON.parse(data[LOCAL_STORAGE.weather])

            // Validate that parsed data has required structure
            if (!parsed.location || !parsed.temp || !parsed.condition) {
              reject(new Error("Invalid cached data structure"))

              return
            }

            resolve(parsed)
          } catch {
            reject(new Error("Failed to parse cached data"))
          }
        })
      })
    })

    return cachedData || null
  }

  // Helper function to check if cached data is still valid
  const isCacheValid = (cachedData: CachedWeatherData): boolean => {
    return cachedData.expires > Date.now()
  }

  // Helper function to get user position
  const getUserPosition = async () => {
    return new Promise<{ lat: number; lon: number; accurate: boolean }>(
      // eslint-disable-next-line no-async-promise-executor
      async (resolve, reject) => {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (p) => {
              resolve({
                lat: Number(p.coords.latitude),
                lon: Number(p.coords.longitude),
                accurate: true,
              })
            },
            async () => {
              // Fallback to IP-based location
              try {
                const response = await fetch("https://ipapi.co/json/")
                if (!response.ok) throw new Error("IP location failed")

                const data = await response.json()
                resolve({
                  lat: Number(data.latitude),
                  lon: Number(data.longitude),
                  accurate: false,
                })
              } catch {
                reject(
                  new Error("Failed to get location via geolocation or IP"),
                )
              }
            },
          )
        } else {
          // No geolocation support, try IP-based location
          try {
            const response = await fetch("https://ipapi.co/json/")
            if (!response.ok) throw new Error("IP location failed")

            const data = await response.json()
            resolve({
              lat: Number(data.latitude),
              lon: Number(data.longitude),
              accurate: false,
            })
          } catch {
            reject(
              new Error("Geolocation not supported and IP location failed"),
            )
          }
        }
      },
    )
  }

  // Helper function to fetch fresh weather data
  const fetchFreshWeatherData = async (position: {
    lat: number
    lon: number
  }) => {
    const key = process.env.PLASMO_PUBLIC_WEATHER_API_KEY
    const response = await fetch(
      `http://api.weatherapi.com/v1/current.json?key=${key}&q=${position.lat},${position.lon}`,
    )

    if (!response.ok) throw new Error("Failed to fetch weather data")

    const data = await response.json()

    return {
      location: data.location.name + ", " + data.location.country,
      temp: {
        celsius: data.current.temp_c,
        fahrenheit: data.current.temp_f,
      },
      condition: data.current.condition,
    } as WeatherData
  }

  // Helper function to save weather data to cache
  const saveWeatherToCache = (weatherData: WeatherData) => {
    const cachedData: CachedWeatherData = {
      ...weatherData,
      expires: Date.now() + 1000 * 60 * 60 * 2, // 2 hours
    }

    chrome.storage.local.set({
      [LOCAL_STORAGE.weather]: JSON.stringify(cachedData),
    })
  }

  // Helper function to fallback to cached data
  const fallbackToCachedData = async () => {
    const cachedData = await getCachedWeatherData()

    if (cachedData) {
      setWeatherData(cachedData)

      return true
    }

    return false
  }

  useAsyncEffect(async () => {
    setIsLoading(true)
    setError({ message: "", err: false })

    try {
      // First, always try to get cached data
      const cachedData = await getCachedWeatherData()

      // If user is offline
      if (!isOnline) {
        if (cachedData) {
          setWeatherData(cachedData)
          setIsLoading(false)

          return
        } else {
          setError({
            message:
              "No internet connection and no cached weather data available",
            err: true,
          })
          setIsLoading(false)

          return
        }
      }

      // User is online - check if we have valid cached data
      if (cachedData && isCacheValid(cachedData)) {
        setWeatherData(cachedData)
        setIsLoading(false)

        return
      }

      // Cache is not available or expired, fetch fresh data
      try {
        const position = await getUserPosition()
        const freshWeatherData = await fetchFreshWeatherData(position)

        // Save fresh data to cache
        saveWeatherToCache(freshWeatherData)

        setWeatherData(freshWeatherData)
        setIsLoading(false)
      } catch (fetchError) {
        // Error occurred while fetching fresh data, try to fallback to cached data
        console.warn("Failed to fetch fresh weather data:", fetchError)

        const fallbackSuccessful = await fallbackToCachedData()

        if (fallbackSuccessful) {
          setError({
            message: "Using cached weather data (unable to fetch latest)",
            err: false, // Not a critical error since we have fallback data
          })
        } else {
          setError({
            message:
              fetchError instanceof Error
                ? fetchError.message
                : "Failed to fetch weather data",
            err: true,
          })
        }

        setIsLoading(false)
      }
    } catch (unexpectedError) {
      // Unexpected error in the main flow
      console.error("Unexpected error in weather hook:", unexpectedError)

      const fallbackSuccessful = await fallbackToCachedData()

      if (!fallbackSuccessful) {
        setError({
          message: "An unexpected error occurred while fetching weather data",
          err: true,
        })
      }

      setIsLoading(false)
    }
  }, [isOnline])

  return { weatherData, isLoading, error }
}

export { useFetchWeather }
