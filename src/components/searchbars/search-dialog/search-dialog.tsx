import { cn } from "@/lib/cn"
import { SearchIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import React, { useEffect, useState } from "react"
import chatgpt from "data-base64:@/assets/openai.svg"
import claude from "data-base64:@/assets/claude.svg"
import gemini from "data-base64:@/assets/gemini.svg"
import deepseek from "data-base64:@/assets/deepseek.svg"
import { Badge } from "../../ui/badge"
import useDebouncedValue from "@/hooks/use-debounced-value"

type Props = {
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

const SearchDialog = ({ defaultOpen, onOpenChange }: Props) => {
  const [open, setOpen] = useState(defaultOpen)
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    const query = searchQuery.trim()

    if (query) {
      e.preventDefault()

      // search using the search engine from browser settings
      await chrome.search.query({
        text: query,
        disposition: "CURRENT_TAB",
      })
    }
  }

  const [resultsFromHistory, setResultsFromHistory] = useState<
    chrome.history.HistoryItem[]
  >([])
  const [resultsFromBookmarks, setResultsFromBookmarks] = useState<
    chrome.bookmarks.BookmarkTreeNode[]
  >([])
  const [searchResults, setSearchResults] = useState<string[]>([])

  useEffect(() => {
    chrome.bookmarks.search(debouncedSearchQuery, (results) => {
      setResultsFromBookmarks(results)
      console.log("resultsFromBookmarks", results)
    })
  }, [debouncedSearchQuery])

  useEffect(() => {
    const search = async () => {
      const results = await fetch(
        `https://suggestqueries.google.com/complete/search?client=firefox&q=${debouncedSearchQuery}`,
      )
      const data = await results.json()
      setSearchResults(data[1])
    }

    search()
  }, [debouncedSearchQuery])

  useEffect(() => {
    if (!debouncedSearchQuery) return
    chrome.history.search(
      {
        text: debouncedSearchQuery,
        maxResults: 10,
      },
      (results) => {
        setResultsFromHistory(results)
        console.log("resultsFromHistory", results)
      },
    )
  }, [debouncedSearchQuery])

  useEffect(() => {
    setOpen(defaultOpen)
  }, [defaultOpen])

  useEffect(() => {
    if (onOpenChange) {
      onOpenChange(open)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    setSearchQuery("")
  }, [open])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        e.preventDefault()
        setOpen(false)
      }
    }

    const handleOpen = (e: KeyboardEvent) => {
      if (e.key === "," && e.ctrlKey && !open) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    window.addEventListener("keydown", handleEscape)
    window.addEventListener("keydown", handleOpen)

    return () => {
      window.removeEventListener("keydown", handleEscape)
      window.removeEventListener("keydown", handleOpen)
    }
  }, [])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
            className="w-screen h-screen fixed inset-0 bg-black/40 backdrop-blur-md z-[99]"
          />

          <div className="w-screen h-screen flex flex-col items-center justify-center fixed inset-0 z-[100] gap-4">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-[500px] mx-auto"
            >
              <form
                onSubmit={handleSubmit}
                className={cn(
                  "flex-grow flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground disabled:cursor-default disabled:opacity-50 md:text-sm relative group-hover:border-accent group-hover:shadow-lg",
                )}
              >
                <input
                  onBlur={() => setOpen(false)}
                  autoFocus
                  type="text"
                  placeholder="Search the web..."
                  className="w-full h-full bg-transparent !outline-none focus:outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <SearchIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
              </form>
            </motion.div>
            <div className="grid grid-cols-4 gap-2 w-full max-w-[500px] mx-auto">
              {[
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
              ].map((engine, index) => (
                <AnimatePresence key={engine.name}>
                  <motion.button
                    key={engine.name}
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    transition={{ duration: 0.2, delay: index * 0.1 + 0.2 }}
                    onClick={() => {
                      if (engine.available && searchQuery) {
                        const url = `${engine.url}?q=${searchQuery}`
                        window.open(url, "_blank")
                      }
                    }}
                    disabled={!engine.available || !searchQuery}
                    className={cn(
                      "w-full aspect-square flex flex-col gap-1 items-center hover:border hover:border-accent justify-center p-2 py-5 rounded-md bg-black/10 disabled:opacity-50 relative",
                    )}
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
                  </motion.button>
                </AnimatePresence>
              ))}
            </div>
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
                  {searchResults.slice(0, 5).map((result, i) => (
                    <a
                      key={i}
                      href={`https://www.google.com/search?q=${result}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex gap-2 flex-col bg-black/10 p-2 rounded-md"
                    >
                      <span className="text-sm font-medium truncate">
                        {result}
                      </span>
                    </a>
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
            {searchQuery && (
              <div className="grid grid-cols-2 gap-2 w-full max-w-[500px] mx-auto">
                {resultsFromBookmarks && (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, y: 100 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 100 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "flex flex-col gap-2 bg-black/10 p-2 rounded-md",
                        resultsFromHistory.length === 0 && "col-span-2",
                      )}
                    >
                      {resultsFromBookmarks.slice(0, 5).map((bookmark, i) => (
                        <a
                          key={i}
                          href={bookmark.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex gap-2 flex-col"
                        >
                          <span className="text-sm font-medium truncate">
                            {bookmark.title}
                          </span>
                          <p className="text-xs text-muted-foreground truncate">
                            {bookmark.url}
                          </p>
                        </a>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                )}
                {resultsFromHistory && (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, y: 100 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 100 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "flex flex-col gap-2 bg-black/10 p-2 rounded-md",
                        resultsFromBookmarks.length === 0 && "col-span-2",
                      )}
                    >
                      {resultsFromHistory.slice(0, 5).map((history, i) => (
                        <a
                          key={i}
                          href={history.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex gap-2 flex-col"
                        >
                          <span className="text-sm font-medium truncate">
                            {history.title}
                          </span>
                          <p className="text-xs text-muted-foreground truncate">
                            {history.url}
                          </p>
                        </a>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export default SearchDialog
