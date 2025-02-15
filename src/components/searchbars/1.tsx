import { cn } from "@/helpers/cn"
import { SearchIcon } from "lucide-react"
import React from "react"

type Props = {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

const Searchbar1 = ({ isOpen, setIsOpen }: Props) => {
  return (
    <div
      onClick={() => setIsOpen(true)}
      className={cn(
        "flex items-center space-x-2 w-full mx-auto cursor-text group transition-all relative duration-100",
        isOpen ? "-top-96" : "top-0"
      )}>
      <div
        className={cn(
          "flex-grow flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground disabled:cursor-default disabled:opacity-50 md:text-sm relative group-hover:border-accent group-hover:shadow-lg"
        )}>
        <span className="text-muted-foreground">Search the web...</span>
        <SearchIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
      </div>
    </div>
  )
}

export default Searchbar1
