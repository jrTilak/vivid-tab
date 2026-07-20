import { IconTrash } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useNotes } from "./use-notes";

const Notes = () => {
	const { addNote, deleteNote, draft, notes, setDraft } = useNotes();

	return (
		<Card className="p-6">
			<h3 className="mb-4 text-lg font-semibold">Notes:</h3>
			<Textarea
				value={draft}
				onChange={(event) => setDraft(event.target.value)}
				placeholder="Add a note..."
				className="mb-2 border-none"
			/>
			<Button
				size="sm"
				variant="secondary"
				onClick={addNote}
				disabled={!draft.trim()}
			>
				Add Note
			</Button>
			<div className="mt-4 space-y-2">
				{notes.map((note) => (
					<div
						key={note.id}
						className="group relative rounded-md bg-background/10 p-2 text-sm in-data-[visual-effect=opaque]:bg-background in-data-[visual-effect=translucent]:bg-background/30"
					>
						<p className="whitespace-pre-wrap wrap-break-word">{note.text}</p>
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
					</div>
				))}
			</div>
		</Card>
	);
};

export { Notes };
