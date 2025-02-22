import React, { useCallback, useEffect, useMemo, useState } from "react"
import { motion } from "motion/react"
// because variables are not working in the shadow DOM, we need to import the styles here
import "@/styles/index.css"
import { AnimatePresence } from "motion/react"
import { cn } from "@/lib/cn"
import { SearchIcon } from "lucide-react"
import { z } from "zod"
import { useSettings } from "@/providers/settings-provider"
import chatgpt from "data-base64:@/assets/openai.svg"
import claude from "data-base64:@/assets/claude.svg"
import gemini from "data-base64:@/assets/gemini.svg"
import deepseek from "data-base64:@/assets/deepseek.svg"
import { Badge } from "@/components/ui/badge"
import useShortcutKey from "@/hooks/use-shortcut-key"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import useDebouncedValue from "@/hooks/use-debounced-value"

type Props = {
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  isNewTab: boolean // determines if user is in new tab page or browsing some website
}

const SearchDialog = ({ defaultOpen, onOpenChange, isNewTab }: Props) => {
  const [open, setOpen] = useState(defaultOpen)
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)
  const {
    settings: { search },
  } = useSettings()

  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])

  useEffect(() => {
    setOpen(defaultOpen)
  }, [defaultOpen])

  useEffect(() => {
    if (onOpenChange) {
      onOpenChange(open)
    }

    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    setSearchQuery("")
  }, [open])

  useEffect(() => {
    const search = async () => {
      const results = await fetch(
        `https://suggestqueries.google.com/complete/search?client=firefox&q=${debouncedSearchQuery}`,
      )
      const data = await results.json()
      setSearchSuggestions(data[1])
    }

    search()
  }, [debouncedSearchQuery])

  const handleSearchQuery = useCallback(
    (query: string) => {
      const { success } = z.string().url().safeParse(query)

      // open the url directly if it's a valid url
      if (success) {
        if (isNewTab) {
          if (search.openResultInFromNewTab === "new-tab") {
            chrome.tabs.create({ url: query })
          } else {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (tabs.length > 0) {
                chrome.tabs.update(tabs[0].id, { url: query })
              }
            })
          }
        } else {
          if (search.openResultInFromWebPage === "new-tab") {
            chrome.tabs.create({ url: query })
          } else {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (tabs.length > 0) {
                chrome.tabs.update(tabs[0].id, { url: query })
              }
            })
          }
        }
        // else search the web
      } else {
        if (isNewTab) {
          chrome.search.query({
            text: query,
            disposition:
              search.openResultInFromNewTab === "new-tab"
                ? "NEW_TAB"
                : "CURRENT_TAB",
          })
        } else {
          chrome.search.query({
            text: query,
            disposition:
              search.openResultInFromWebPage === "new-tab"
                ? "NEW_TAB"
                : "CURRENT_TAB",
          })
        }
      }
    },
    [isNewTab, search.openResultInFromNewTab, search.openResultInFromWebPage],
  )

  const AI_ENGINES = useMemo(
    () => [
      {
        name: "ChatGPT",
        url: "https://chatgpt.com",
        available: true,
        icon: chatgpt,
      },
      {
        name: "Claude",
        url: "https://claude.ai/new",
        available: true,
        icon: claude,
      },
      {
        name: "Gemini",
        url: "https://gemini.google.com",
        available: false,
        icon: gemini,
      },
      {
        name: "DeepSeek",
        url: "https://deepseek.com",
        available: false,
        icon: deepseek,
      },
    ],
    [],
  )

  useShortcutKey({
    keys: ["Escape"],
    callback: () => setOpen(false),
  })

  useShortcutKey({
    keys: ["Control", ","],
    callback: () => setOpen((prev) => !prev),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="shadow-none border-none bg-transparent"
        overlayClassName="bg-black/40 backdrop-blur-md"
      >
        <div className="flex flex-col items-center justify-center gap-4">
          {/* search form */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-[500px] mx-auto h-fit"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSearchQuery(searchQuery)
              }}
              className={cn(
                "flex-grow flex h-10 w-full text-base bg-transparent gap-1",
              )}
            >
              <input
                autoFocus
                type="text"
                placeholder="Search the web..."
                className="w-full h-full !outline-none rounded-l-md bg-background px-3 py-2 placeholder:text-muted-foreground flex-grow border border-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                disabled={!searchQuery}
                type="submit"
                className="h-full !outline-none rounded-r-md bg-background px-3 py-2 disabled:opacity-50 border border-input"
              >
                <SearchIcon className="text-muted-foreground size-4" />
              </button>
            </form>
          </motion.div>

          {/* ai */}
          <div className="grid grid-cols-4 gap-2 w-full max-w-[500px] mx-auto">
            {AI_ENGINES.map((engine, index) => (
              <AnimatePresence key={engine.name}>
                <motion.div
                  key={engine.name}
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 100 }}
                  transition={{ duration: 0.1, delay: index * 0.1 + 0.1 }}
                  onClick={() => {
                    if (engine.available && searchQuery) {
                      const url = `${engine.url}?q=${searchQuery}`
                      window.open(url, "_blank")
                    }
                  }}
                  className={cn("w-full aspect-square")}
                >
                  <Button
                    disabled={!engine.available}
                    variant="none"
                    className="w-full h-full flex flex-col gap-1 items-center justify-center p-2 py-5 rounded-md bg-black/10 relative hover:border hover:border-input"
                  >
                    <img
                      src={engine.icon}
                      alt={engine.name}
                      className="size-8"
                    />
                    <span className="text-sm">Ask {engine.name}</span>

                    {!engine.available && (
                      <Badge
                        variant="default"
                        className="absolute top-0 right-0 text-[10px] opacity-50 rounded-md rounded-tl-none rounded-br-none "
                      >
                        Coming Soon
                      </Badge>
                    )}
                  </Button>
                </motion.div>
              </AnimatePresence>
            ))}
          </div>

          {/* search suggestions */}

          {searchQuery && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "flex flex-wrap gap-2 w-full max-w-[500px] mx-auto",
                )}
              >
                {searchSuggestions.slice(0, 5).map((result, i) => (
                  <Button
                    key={i}
                    variant="none"
                    onClick={() => handleSearchQuery(result)}
                    className="flex gap-2 flex-col bg-black/10 p-2 rounded-md"
                  >
                    <span className="text-xs truncate">{result}</span>
                  </Button>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SearchDialog
