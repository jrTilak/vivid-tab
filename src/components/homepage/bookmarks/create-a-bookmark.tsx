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
  parentId?: string
  defaultValues?: {
    url: string
    title: string
    id: string
  }
  open: boolean
  setOpen: (open: boolean) => void
}

const CreateABookmark = ({ parentId, defaultValues, open, setOpen }: Props) => {
  const [value, setValue] = useState({
    url: defaultValues?.url || "",
    title: defaultValues?.title || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!value.url || !value.title) return

    if (defaultValues) {
      chrome.bookmarks.update(defaultValues.id, value, () => {
        setValue({ url: "", title: "" })
        setOpen(false)
      })
    } else {
      chrome.bookmarks.create(
        { parentId: parentId, title: value.title, url: value.url },
        () => {
          setValue({ url: "", title: "" })
          setOpen(false)
        },
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogClose />
          <DialogHeader>
            <DialogTitle>
              {defaultValues ? "Edit bookmark" : "Create a bookmark"}
            </DialogTitle>
            <DialogDescription>
              {defaultValues
                ? "Edit the bookmark you want to update."
                : "Enter the name of the bookmark you want to create."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <div className="grid gap-4">
              <Input
                value={value.title}
                onChange={(e) =>
                  setValue((prev) => ({ ...prev, title: e.target.value }))
                }
                id="name"
                placeholder="Name"
                className="col-span-3"
              />
            </div>
            <div className="grid gap-4">
              <Input
                value={value.url}
                type="url"
                onChange={(e) =>
                  setValue((prev) => ({ ...prev, url: e.target.value }))
                }
                id="url"
                placeholder="https://...."
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              size="sm"
              className="min-w-32"
              disabled={value.title.length === 0 || value.url.length === 0}
              type="submit"
            >
              Save{" "}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateABookmark
