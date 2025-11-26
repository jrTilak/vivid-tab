import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { tryCatchAsync } from "@/lib/try-catch-async"
import { useAsyncEffect } from "@/hooks/use-async-effect"
import { useSettings } from "@/providers/settings-provider"
import { Trash2Icon } from "lucide-react"
import React, { useCallback, useState } from "react"

type CategoriesResponse = {
  _id: string
  name: string
  slug: string
}

const QuotesSettings = () => {
  const {
    settings: { quotes },
    setSettings,
  } = useSettings()
  const [isLoaded, setIsLoaded] = useState(false)
  const [categories, setCategories] = useState<CategoriesResponse[]>([])

  const handleSettingsChange = useCallback(
    (key: string, value: unknown) => {
      setSettings((prevSettings) => ({
        ...prevSettings,
        quotes: {
          ...prevSettings.quotes,
          [key]: value,
        },
      }))
    },
    [quotes],
  )

  useAsyncEffect(async () => {
    const [err, data] = await tryCatchAsync(async () => {
      const response = await fetch("https://api.quotable.io/tags")

      return (await response.json()) as CategoriesResponse[]
    })

    if (err || !data) {
      console.error(err)
      setIsLoaded(true)

      return
    }

    setCategories(data)
    setIsLoaded(true)
  })

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-3">
        <div className="space-y-0.5 flex items-center justify-between">
          <Label className="text-base">Categories</Label>
          <button
            disabled={quotes.categories.length === 0}
            onClick={() => handleSettingsChange("categories", [])}
            className="disabled:opacity-60"
          >
            <Trash2Icon className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {isLoaded
            ? categories.map(({ name, slug }) => (
                <div
                  key={slug}
                  className="flex items-center space-x-2 text-muted-foreground"
                >
                  <Checkbox
                    id={slug}
                    checked={quotes.categories.includes(slug)}
                    onCheckedChange={() => {
                      const newCategories = quotes.categories.includes(slug)
                        ? quotes.categories.filter(
                            (category) => category !== slug,
                          )
                        : [...quotes.categories, slug]

                      handleSettingsChange("categories", newCategories)
                    }}
                  />
                  <Label htmlFor={slug}>{name}</Label>
                </div>
              ))
            : Array.from({ length: 8 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-4 bg-muted-foreground/20 rounded-sm"
                />
              ))}
        </div>
      </div>
    </div>
  )
}

export default QuotesSettings
