import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useFlattenBookmarkFolders } from "@/hooks/use-flatten-bookmark-folders";
import { useWelcomeContext } from "./_context";
import { useCompleteWelcome } from "./use-complete-welcome";
import { WelcomeStepCard } from "./welcome-ui";

const ImportFromBrowserBookmarks = () => {
	const folders = useFlattenBookmarkFolders();
	const [selectedFolder, setSelectedFolder] = useState("");
	const { navigate } = useWelcomeContext();
	const { completeWelcome, errorMessage, isCompleting } = useCompleteWelcome();

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!selectedFolder) return;

		void completeWelcome(() => selectedFolder);
	};

	return (
		<form className="w-full max-w-lg" onSubmit={handleSubmit}>
			<WelcomeStepCard
				description="Select the browser folder to show as Vivid bookmarks."
				errorMessage={errorMessage}
				footer={
					<>
						<Button
							disabled={isCompleting}
							onClick={() => navigate("IMPORT", "backward")}
							type="button"
							variant="ghost"
						>
							<IconChevronLeft />
							BACK
						</Button>
						<Button
							aria-busy={isCompleting}
							disabled={!selectedFolder || isCompleting}
							type="submit"
							variant="ghost"
						>
							{isCompleting ? "FINISHING..." : "FINISH"}
							<IconChevronRight />
						</Button>
					</>
				}
				title="Import from browser bookmarks"
			>
				<label className="sr-only" htmlFor="browser-bookmark-folder">
					Browser bookmark folder
				</label>
				<Select
					disabled={folders.length === 0 || isCompleting}
					onValueChange={setSelectedFolder}
					value={selectedFolder}
				>
					<SelectTrigger className="w-full" id="browser-bookmark-folder">
						<SelectValue
							placeholder={
								folders.length === 0
									? "No browser bookmark folders found"
									: "Select folder"
							}
						/>
					</SelectTrigger>
					<SelectContent>
						{folders.map((folder) => (
							<SelectItem key={folder.id} value={folder.id}>
								<span style={{ paddingInlineStart: folder.depth * 12 }}>
									{folder.title}
								</span>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</WelcomeStepCard>
		</form>
	);
};

export { ImportFromBrowserBookmarks };
