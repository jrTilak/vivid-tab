import { IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteBookmark } from "./bookmark-operations";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	id: string;
	label: string;
	url?: string;
};

const DeleteDialog = ({ open, onOpenChange, id, label, url }: Props) => {
	const [errorMessage, setErrorMessage] = useState<string>();
	const [isDeleting, setIsDeleting] = useState(false);

	const deleteUrl = async () => {
		if (isDeleting) return;

		setErrorMessage(undefined);
		setIsDeleting(true);

		try {
			await deleteBookmark(id, { isFolder: url === undefined, url });
			onOpenChange(false);
		} catch (error) {
			console.error("Failed to remove bookmark:", error);
			setErrorMessage("Could not delete this item. Please try again.");
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. This will permanently delete {label}.
					</AlertDialogDescription>
					{errorMessage && (
						<p className="text-sm text-destructive" role="alert">
							{errorMessage}
						</p>
					)}
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<Button
						className="min-w-32"
						disabled={isDeleting}
						onClick={() => void deleteUrl()}
						variant="destructive"
					>
						{isDeleting ? "Deleting…" : "Delete"}{" "}
						<IconTrash className="size-4" />
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export { DeleteDialog };
