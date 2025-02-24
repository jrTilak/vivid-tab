import React, { useCallback, useEffect, useMemo, useState } from "react"
import { motion } from "motion/react"
import { AnimatePresence } from "motion/react"
import { cn } from "@/lib/cn"
import { SearchIcon } from "lucide-react"
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
import useSearchSuggestions from "@/hooks/use-search-suggestions"
import { BACKGROUND_ACTIONS } from "@/constants/background-actions"

type Props = {
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  portalRef?: React.RefObject<HTMLElement>
}

const SearchDialog = ({ defaultOpen, onOpenChange, portalRef }: Props) => {
  const [open, setOpen] = useState(defaultOpen)
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)

  const {
    settings: { searchbar, general },
  } = useSettings()

  const searchSuggestions = useSearchSuggestions({
    query: debouncedSearchQuery,
    enabled: debouncedSearchQuery && searchbar.searchSuggestions,
  })

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

  useEffect(() => {}, [debouncedSearchQuery])

  const handleSearchQuery = useCallback(
    (query: string) => {
      chrome.runtime.sendMessage({
        action: BACKGROUND_ACTIONS.SEARCH_QUERY,
        query,
        openIn: general.openUrlIn,
      })
      onOpenChange(false)
      setSearchQuery("")
    },
    [general.openUrlIn],
  )

  const SHORTCUTS = useMemo(
    () =>
      [
        {
          name: "Ask ChatGPT",
          id: "chatgpt",
          available: true,
          icon: chatgpt,
          onQuery: (query: string) => {
            handleSearchQuery(`https://chatgpt.com/?q=${query}`)
          },
        },
        {
          name: "Ask Claude",
          available: true,
          id: "claude",
          icon: claude,
          onQuery: (query: string) => {
            handleSearchQuery(`https://claude.ai/new?q=${query}`)
          },
        },
        {
          name: "Ask Gemini",
          available: false,
          icon: gemini,
          id: "gemini",
        },
        {
          name: "Ask DeepSeek",
          available: false,
          icon: deepseek,
          id: "deepseek",
        },
        {
          name: "Open Youtube",
          available: true,
          icon: "https://www.svgrepo.com/show/475700/youtube-color.svg",
          id: "youtube",
          onQuery: (query: string) => {
            handleSearchQuery(`https://youtube.com/search?q=${query}`)
          },
        },
      ] as const,
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
        className={cn(
          "shadow-none w-fit !border-none !outline-none",
          searchbar.dialogBackground === "transparent"
            ? "bg-transparent"
            : "bg-background",
        )}
        overlayClassName="bg-black/40 backdrop-blur-[12px]"
        portalContainer={portalRef?.current}
      >
        <div className="flex flex-col items-center backdrop-blur-md justify-center gap-4">
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

                switch (searchbar.submitDefaultAction) {
                  case "default":
                    handleSearchQuery(searchQuery)
                    break
                  case "ask-chatgpt":
                    SHORTCUTS.find((s) => s.id === "chatgpt")?.onQuery?.(
                      searchQuery,
                    )
                    break
                  case "ask-claude":
                    SHORTCUTS.find((s) => s.id === "claude")?.onQuery?.(
                      searchQuery,
                    )
                    break
                  case "search-on-youtube":
                    SHORTCUTS.find((s) => s.id === "youtube")?.onQuery?.(
                      searchQuery,
                    )
                    break
                }
              }}
              className={cn(
                "flex-grow flex h-10 w-full text-base bg-transparent gap-1",
              )}
            >
              <input
                autoFocus
                type="text"
                id="vivid-search-bar"
                placeholder="Search the web..."
                className="w-full h-full !outline-none rounded-l-md bg-background px-3 py-2 placeholder:text-muted-foreground flex-grow border border-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                disabled={!searchQuery}
                type="submit"
                className="h-full !outline-none rounded-r-md bg-accent px-3 py-2 disabled:opacity-50 border border-input"
              >
                <SearchIcon className="text-muted-foreground size-4" />
              </button>
            </form>
          </motion.div>

          {/* ai */}
          <div className="grid grid-cols-4 gap-2 w-full max-w-[500px] mx-auto">
            {SHORTCUTS.map((engine, index) => {
              if (searchbar.shortcuts.includes(engine.id)) {
                return (
                  <AnimatePresence key={engine.name}>
                    <motion.div
                      key={engine.name}
                      initial={{ opacity: 0, y: 100 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 100 }}
                      transition={{ duration: 0.1, delay: index * 0.1 + 0.1 }}
                      onClick={() => {
                        if (engine.available && searchQuery) {
                          if (engine.onQuery) {
                            engine.onQuery(searchQuery)
                          }
                        }
                      }}
                      className={cn("w-full aspect-square")}
                    >
                      <Button
                        disabled={!engine.available}
                        variant="none"
                        className={cn(
                          "w-full h-full flex flex-col gap-1 items-center justify-center p-2 py-5 rounded-md relative hover:border hover:border-input focus-visible:ring-destructive",
                          searchbar.dialogBackground === "transparent"
                            ? "bg-background"
                            : "bg-black/10 dark:bg-white/10",
                        )}
                      >
                        <img
                          src={engine.icon}
                          alt={engine.name}
                          className="size-8"
                        />
                        <span className="text-sm">{engine.name}</span>

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
                )
              }
            })}
          </div>

          {/* search suggestions */}

          {searchQuery && searchbar.searchSuggestions && (
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
                    variant="none"
                    key={i}
                    className="h-fit w-auto focus-visible:ring-destructive !px-0 !py-0"
                    onClick={() => handleSearchQuery(result)}
                  >
                    <Badge
                      variant="secondary"
                      className="text-xs truncate font-normal"
                    >
                      {result}
                    </Badge>
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
