import React, { useState } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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
  const [value, setValue] = useState(defaultValues?.title || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!value) return

    if (defaultValues) {
      chrome.bookmarks.update(
        defaultValues.id,
        { title: value },
        () => {
          setValue('')
          setOpen(false)
        }
      )
    } else {
      chrome.bookmarks.create(
        { 'parentId': parentId, 'title': value },
        () => {
          setValue('')
          setOpen(false)
        },
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogClose />
          <DialogHeader>
            <DialogTitle>
              {
                defaultValues ? "Edit bookmark folder" : "Create a bookmark folder"
              }
            </DialogTitle>
            <DialogDescription>
              {
                defaultValues ? "Edit the folder you want to update." : "Enter the name of the folder you want to create."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              id="name" placeholder='Bookmarks' className="col-span-3" />
          </div>
          <DialogFooter>
            <Button size='sm' className='min-w-32' disabled={value.length === 0} type="submit">Save </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateAFolder