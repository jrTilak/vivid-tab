import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import tryCatchAsync from "@/helpers/try-catch-async"
import useAsyncEffect from "@/hooks/use-async-effect"
import { useSettings } from "@/providers/settings-provider"
import React, { useState } from "react"

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
    message: ""
  })
  const {
    settings: {
      quotes: { categories }
    }
  } = useSettings()

  useAsyncEffect(async () => {
    const [err, data] = await tryCatchAsync(async () => {
      const baseUrl = "http://api.quotable.io/quotes/random"
      const urlWithTags =
        categories.length > 0
          ? `${baseUrl}?tags=${categories.join("|")}`
          : baseUrl
      const response = await fetch(urlWithTags)
      const json = (await response.json()) as QuoteResponse[]
      return json[0]
    })

    if (err || !data) {
      setErr({
        err: true,
        message: err.message
      })
      setIsLoaded(true)
      return
    }

    setQuote(data)
  }, [])

  if (!isLoaded) {
    ;<Skeleton className="h-24" />
  }

  return (
    <Card className=" p-6">
      <blockquote className="space-y-2">
        <p className="text-sm italic">
          "
          {err.err
            ? "An error occurred while fetching the quote"
            : quote?.content}
          "
        </p>
        <footer className="text-xs">
          — {err.err ? "Unknown" : quote?.author}{" "}
        </footer>
      </blockquote>
    </Card>
  )
}

export default Quote
