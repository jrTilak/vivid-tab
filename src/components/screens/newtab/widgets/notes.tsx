import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { TrashIcon } from "lucide-react"
import React from "react"

type Note = {
  id: number
  text: string
  createdAt: number
}

const Notes = () => {
  const [note, setNote] = React.useState("")
  const btnRef = React.useRef<HTMLButtonElement>(null)

  const [notes, setNotes] = React.useState<Note[]>([])

  // get notes from local storage
  React.useEffect(() => {
    chrome.storage.sync.get("notes", (data) => {
      if (data.notes) {
        try {
          setNotes(JSON.parse(data.notes))
        } catch (e) {
          console.error(e)
        }
      }
    })
  }, [])

  // update notes in storage
  const updateNotesInStorage = (notes: Note[]) => {
    chrome.storage.sync.set({ notes: JSON.stringify(notes) })
  }

  const addNote = () => {
    const newNotes = [
      ...notes,
      {
        id: Date.now(),
        text: note,
        createdAt: new Date().getTime(),
      },
    ]
    setNotes(newNotes)
    updateNotesInStorage(newNotes)
    setNote("")
  }

  const deleteNote = (id: number) => {
    const newNotes = notes.filter((note) => note.id !== id)
    setNotes(newNotes)
    updateNotesInStorage(newNotes)
  }

  return (
    <Card className="p-6  ">
      <h3 className="mb-4 text-lg font-semibold">Notes:</h3>
      <Textarea
        tabIndex={-1}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note..."
        className="mb-2 bg-background/10 border-none"
      />
      <Button
        tabIndex={-1}
        size="sm"
        variant="secondary"
        onClick={addNote}
        disabled={!note.trim()}
        ref={btnRef}
      >
        Add Note
      </Button>
      <div className="mt-4 space-y-2">
        {
          // sort notes by createdAt
          notes
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((note, index) => (
              <div
                key={index}
                className="text-sm bg-white/10 p-2 rounded relative group"
              >
                {note.text}
                <button
                  tabIndex={-1}
                  onClick={() => deleteNote(note.id)}
                  className="absolute top-2 right-2 text-red-500 scale-0 group-hover:scale-100 transition-transform"
                >
                  <TrashIcon size={16} />
                </button>
              </div>
            ))
        }
      </div>
    </Card>
  )
}

export { Notes }
