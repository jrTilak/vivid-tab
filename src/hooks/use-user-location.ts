import { useState } from "react"

import { useAsyncEffect } from "./use-async-effect"

/**
 * Gets user's location using browser's geolocation API or IP-based fallback
 * First tries navigator.geolocation, falls back to ipapi.co if not available
 */
const useUserLocation = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState({
    message: "",
    err: false,
  })
  const [position, setPosition] = useState({
    lat: 0,
    lon: 0,
    accurate: false,
  })

  useAsyncEffect(async () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPosition({
            lat: Number(position.coords.latitude),
            lon: Number(position.coords.longitude),
            accurate: true,
          })
          setIsLoading(false)
        },
        (error) => {
          setError({
            message: error.message,
            err: true,
          })
          setIsLoading(false)
        },
      )
    } else {
      const location = await fetch("https://ipapi.co/json/")

      if (!location.ok) {
        setError({
          message:
            "Failed to get your location, Either enable geolocation or internet connection",
          err: true,
        })

        return
      }

      const data = await location.json()

      setPosition({
        lat: Number(data.latitude),
        lon: Number(data.longitude),
        accurate: false,
      })
      setIsLoading(false)
    }
  }, [])

  return { position, isLoading, error }
}

export { useUserLocation }
