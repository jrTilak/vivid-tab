import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { tryCatchAsync } from "@/lib/try-catch-async"
import { useAsyncEffect } from "@/hooks/use-async-effect"
import { useSettings } from "@/providers/settings-provider"
import React, { useState } from "react"
import { LOCAL_STORAGE } from "@/constants/keys"

type QuoteResponse = {
  _id: string
  content: string
  author: string
}

const Quote = () => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [quote, setQuote] = useState<QuoteResponse | null>(null)
  const [err, setErr] = useState({
    err: false,
    message: "",
  })
  const {
    settings: {
      quotes: { categories },
    },
  } = useSettings()

  useAsyncEffect(async () => {
    const [err, data] = await tryCatchAsync(async () => {
      const baseUrl = "http://api.quotable.io/quotes/random"
      const urlWithTags =
        categories.length > 0
          ? `${baseUrl}?tags=${categories.join("|")}&maxLength=80`
          : baseUrl
      const response = await fetch(urlWithTags)
      const json = (await response.json()) as QuoteResponse[]

      return json[0]
    })

    if (err || !data) {

      const [err, cachedQuote] = await tryCatchAsync<Error, QuoteResponse>(() => {
        return JSON.parse(localStorage.getItem(LOCAL_STORAGE.quote))
      })

      if (err) {
        setErr({
          err: true,
          message: err.message,
        })
        setIsLoaded(true)
      } else {
        setQuote(cachedQuote)
      }

      return
    }

    localStorage.setItem(LOCAL_STORAGE.quote, JSON.stringify(data))
    setQuote(data)
  }, [])

  if (!isLoaded) {
    ; <Skeleton className="h-24" />
  }

  if (err.err) return null

  return (
    <Card className=" p-6">
      <blockquote className="space-y-2">
        <p className="text-sm italic">
          &apos;
          {quote?.content}
          &apos;
        </p>
        <footer className="text-xs">
          — {err.err ? "Unknown" : quote?.author}{" "}
        </footer>
      </blockquote>
    </Card>
  )
}

export { Quote }
