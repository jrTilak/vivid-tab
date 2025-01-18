import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import React from 'react'

const Notes = () => {
  const [note, setNote] = React.useState("")

  const [notes, setNotes] = React.useState<string[]>([])

  const addNote = () => {
    setNotes((prev) => [...prev, note])
    setNote("")
  }

  return (
    <Card className="bg-black/40 p-6 text-white backdrop-blur">
      <h3 className="mb-4 text-lg font-semibold">Notes:</h3>
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note..."
        className="mb-2 bg-white/10 text-white"
      />
      <Button
        size="sm"
        variant="secondary"
        onClick={addNote}
      >
        Add Note
      </Button>
      <div className="mt-4 space-y-2">
        {notes.map((note, index) => (
          <div key={index} className="text-sm bg-white/10 p-2 rounded">
            {note}
          </div>
        ))}
      </div>
    </Card>
  )
}

export default Notes