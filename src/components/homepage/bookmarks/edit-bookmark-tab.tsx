import React, { useState } from "react"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type Props = {
    open: boolean
    setOpen: (open: boolean) => void
    id: string
    title: string
}

const EditBookmarkTab = ({ open, setOpen, id, title }: Props) => {
  const [value, setValue] = useState(title || "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!value) return

    if (id && title) {
      chrome.bookmarks.update(id, { title: value }, () => {
        setOpen(false)
        window.dispatchEvent(new Event("bookmarks:update"))
      })
    } 
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogClose />
          <DialogHeader>
            <DialogTitle>
              Edit bookmark tab
            </DialogTitle>
            <DialogDescription>
              Edit the tab you want to update.
            </DialogDescription>
          </DialogHeader>
         <div className="grid gap-4 py-4 grid-cols-[1fr_50px] items-center">
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              id="name"
              placeholder="Bookmarks"
            />
          </div>
          <DialogFooter>
            <Button
              size="sm"
              className="min-w-32"
              disabled={value.length === 0}
              type="submit"
            >
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default EditBookmarkTab
