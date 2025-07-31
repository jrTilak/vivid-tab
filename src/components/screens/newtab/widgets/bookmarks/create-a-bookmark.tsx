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
import { useIcon } from "@/hooks/use-icon"
import {
  removeIconFromLocalStorage,
  saveIconsToLocalStorage,
} from "@/lib/icons-to-local"
import { CloudUploadIcon, X } from "lucide-react"

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
  const { icon, setIcon } = useIcon({ id: defaultValues?.id, defaultIcon: "" })
  const [value, setValue] = useState({
    url: defaultValues?.url || "",
    title: defaultValues?.title || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!value.url || !value.title) return

    if (defaultValues) {
      chrome.bookmarks.update(defaultValues.id, value, () => {
        setOpen(false)

        removeIconFromLocalStorage(`icon-${defaultValues.id}`)

        if (icon) {
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
        { parentId: parentId, title: value.title, url: value.url },
        ({ id }) => {
          setValue({ url: "", title: "" })
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
              {defaultValues ? "Edit bookmark" : "Create a bookmark"}
            </DialogTitle>
            <DialogDescription>
              {defaultValues
                ? "Edit the bookmark you want to update."
                : "Enter the name of the bookmark you want to create."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <div className="grid gap-4 grid-cols-[1fr_50px] items-center">
              <Input
                value={value.title}
                onChange={(e) =>
                  setValue((prev) => ({ ...prev, title: e.target.value }))
                }
                id="name"
                placeholder="Name"
                className=""
              />

              {/* icon input */}
              <div
                className="rounded-full bg-muted flex items-center justify-center aspect-square h-12 w-12 cursor-pointer"
              >
                {icon ? (
                  <div className="relative w-full h-full group">
                    <label htmlFor="icon" className="w-full h-full">
                      <img
                        src={icon}
                        alt=""
                        className="h-full w-full rounded-full object-contain object-center"
                      />
                    </label>
                    {/* a small cross to remove the icon */}
                    <Button
                      variant="secondary"
                      className="absolute text-destructive -top-4 h-auto w-auto px-1 py-1 -right-4 rounded-full scale-0 group-hover:scale-100 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIcon("")
                      }}
                    >
                      <X />
                    </Button>
                  </div>
                ) : (
                  <label htmlFor="icon" className="w-full h-full  flex items-center justify-center">
                    <CloudUploadIcon className="h-6 w-6" />
                  </label>
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
              </div>
            </div>
            <div className="grid gap-4">
              <Input
                value={value.url}
                type="url"
                onChange={(e) =>
                  setValue((prev) => ({ ...prev, url: e.target.value }))
                }
                id="url"
                placeholder="https://... or file://..."
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

export { CreateABookmark }
