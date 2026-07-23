import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useFlattenBookmarkFolders } from "@/hooks/use-flatten-bookmark-folders";
import { moveBookmark } from "./bookmark-operations";
import { getValidMoveFolders } from "./bookmark-tree";

type Props = {
	id: string;
	label: string;
	onOpenChange: (open: boolean) => void;
	open: boolean;
};

const MoveBookmarkDialog = ({ open, onOpenChange, id, label }: Props) => {
	const folders = useFlattenBookmarkFolders();
	const availableFolders = useMemo(
		() => getValidMoveFolders(folders, id),
		[folders, id],
	);
	const [selectedFolder, setSelectedFolder] = useState("");
	const [errorMessage, setErrorMessage] = useState<string>();
	const [isMoving, setIsMoving] = useState(false);

	const handleMove = async () => {
		if (!selectedFolder || isMoving) return;

		setErrorMessage(undefined);
		setIsMoving(true);

		try {
			await moveBookmark(id, { parentId: selectedFolder });
			onOpenChange(false);
		} catch (error) {
			console.error("Failed to move bookmark:", error);
			setErrorMessage("Could not move this item. Please try again.");
		} finally {
			setIsMoving(false);
		}
	};

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Move {label} to?</DialogTitle>
				</DialogHeader>
				<label className="sr-only" htmlFor="move-bookmark-folder">
					Destination folder
				</label>
				<Select
					disabled={availableFolders.length === 0 || isMoving}
					onValueChange={setSelectedFolder}
					value={selectedFolder}
				>
					<SelectTrigger className="w-full" id="move-bookmark-folder">
						<SelectValue
							placeholder={
								availableFolders.length === 0
									? "No available bookmark folders"
									: "Select folder"
							}
						/>
					</SelectTrigger>
					<SelectContent>
						{availableFolders.map((folder) => (
							<SelectItem key={folder.id} value={folder.id}>
								<span style={{ paddingLeft: folder.depth * 10 }}>
									{folder.title}
								</span>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{errorMessage && (
					<p className="text-sm text-destructive" role="alert">
						{errorMessage}
					</p>
				)}
				<DialogFooter>
					<Button
						disabled={!selectedFolder || isMoving}
						onClick={() => void handleMove()}
						type="button"
					>
						{isMoving ? "Moving..." : "Move"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export { MoveBookmarkDialog };
