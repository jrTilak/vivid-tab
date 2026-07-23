import { IconTrash } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useNotes } from "./use-notes";

const Notes = () => {
	const { addNote, deleteNote, draft, notes, setDraft } = useNotes();

	return (
		<div className="flex flex-col gap-2">
			<Card className="gap-2 p-6">
				<h3 className="text-lg font-semibold">Notes:</h3>
				<Textarea
					value={draft}
					onChange={(event) => setDraft(event.target.value)}
					placeholder="Add a note..."
					className="mb-2 border-none"
				/>
				<Button variant="secondary" onClick={addNote} disabled={!draft.trim()}>
					Add Note
				</Button>
			</Card>
			{notes.map((note) => (
				<Card key={note.id} className="group relative p-4" size="sm">
					<p className="whitespace-pre-wrap wrap-break-word pr-6">
						{note.text}
					</p>
					<Button
						aria-label="Delete note"
						className="absolute top-1 right-1 scale-0 text-destructive transition-transform group-focus-within:scale-100 group-hover:scale-100 focus-visible:scale-100"
						onClick={() => deleteNote(note.id)}
						size="icon-xs"
						type="button"
						variant="ghost"
					>
						<IconTrash />
					</Button>
				</Card>
			))}
		</div>
	);
};

export { Notes };
