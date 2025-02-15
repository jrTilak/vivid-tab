import { cn } from "@/helpers/cn"
import { SearchIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import React, { useEffect, useState } from "react"

import { Input } from "../ui/input"

type Props = {
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

const SearchDialog = ({ defaultOpen, onOpenChange }: Props) => {
  const [open, setOpen] = useState(defaultOpen)
  const [searchQuery, setSearchQuery] = useState("")

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
      if (e.key === "Escape") {
        setOpen(false)
      }
    }

    const handleOpen = (e: KeyboardEvent) => {
      if (e.key === "," && e.ctrlKey) {
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

          <div className="w-screen h-screen flex items-center justify-center fixed inset-0 z-[100]">
            <motion.form
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: -200 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-[500px] mx-auto">
              <div
                className={cn(
                  "flex-grow flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground disabled:cursor-default disabled:opacity-50 md:text-sm relative group-hover:border-accent group-hover:shadow-lg"
                )}>
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
              </div>
            </motion.form>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export default SearchDialog
