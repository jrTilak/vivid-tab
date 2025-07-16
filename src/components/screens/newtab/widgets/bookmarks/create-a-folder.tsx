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
import { Label } from "@/components/ui/label"
import { CloudUploadIcon } from "lucide-react"
import {
  removeIconFromLocalStorage,
  saveIconsToLocalStorage,
} from "@/lib/icons-to-local"
import { useIcon } from "@/hooks/use-icon"

type Props = {
  parentId?: string
  defaultValues?: {
    title: string
    id: string
  }
  open: boolean
  setOpen: (open: boolean) => void
}

const CreateAFolder = ({ parentId, defaultValues, open, setOpen }: Props) => {
  const [value, setValue] = useState(defaultValues?.title || "")
  const { icon, setIcon } = useIcon({ id: defaultValues?.id, defaultIcon: "" })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!value) return

    if (defaultValues) {
      chrome.bookmarks.update(defaultValues.id, { title: value }, () => {
        setOpen(false)

        if (icon) {
          removeIconFromLocalStorage(`icon-${defaultValues.id}`)
          saveIconsToLocalStorage({
            key: `icon-${defaultValues.id}`,
            value: {
              icon,
            },
          })

          window.dispatchEvent(new Event("bookmarks:update"))
        }
      })
    } else {
      chrome.bookmarks.create(
        { parentId: parentId, title: value },
        ({ id }) => {
          setValue("")
          setOpen(false)
          setIcon("")

          if (icon) {
            removeIconFromLocalStorage(`icon-${id}`)
            saveIconsToLocalStorage({
              key: `icon-${id}`,
              value: {
                icon,
              },
            })

            window.dispatchEvent(new Event("bookmarks:update"))
          }
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
              {defaultValues
                ? "Edit bookmark folder"
                : "Create a bookmark folder"}
            </DialogTitle>
            <DialogDescription>
              {defaultValues
                ? "Edit the folder you want to update."
                : "Enter the name of the folder you want to create."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 grid-cols-[1fr_50px] items-center">
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              id="name"
              placeholder="Bookmarks"
            />
            {/* icon input */}
            <Label
              htmlFor="icon"
              className="rounded-full bg-muted flex items-center justify-center aspect-square h-12 w-12 cursor-pointer"
            >
              {icon ? (
                <img
                  src={icon}
                  alt=""
                  className="h-full w-full rounded-full object-contain object-center"
                />
              ) : (
                <CloudUploadIcon className="h-6 w-6" />
              )}
              <input
                type="file"
                name="icon"
                id="icon"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]

                  if (file) {
                    // convert to base64
                    const reader = new FileReader()

                    reader.onload = (e) => {
                      setIcon(e.target?.result as string)
                    }

                    reader.readAsDataURL(file)
                  }
                }}
              />
            </Label>
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

export { CreateAFolder }
