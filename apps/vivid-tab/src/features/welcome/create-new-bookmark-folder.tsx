import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { type FormEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_BOOKMARK_FOLDER_NAME } from "@/constants/keys";
import { useWelcomeContext } from "./_context";
import { useCompleteWelcome } from "./use-complete-welcome";
import { WelcomeStepCard } from "./welcome-ui";

const CreateNewBookmarkFolder = () => {
	const [bookmarkFolderName, setBookmarkFolderName] = useState(
		DEFAULT_BOOKMARK_FOLDER_NAME,
	);
	const createdFolderIdRef = useRef<string | undefined>(undefined);
	const { navigate } = useWelcomeContext();
	const { completeWelcome, errorMessage, isCompleting } = useCompleteWelcome();
	const normalizedFolderName = bookmarkFolderName.trim();

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!normalizedFolderName) return;

		void completeWelcome(async () => {
			/* Reuse the folder when persistence or tab replacement needs a retry. */
			if (createdFolderIdRef.current) return createdFolderIdRef.current;

			const bookmark = await chrome.bookmarks.create({
				title: normalizedFolderName,
			});
			createdFolderIdRef.current = bookmark.id;

			return bookmark.id;
		});
	};

	return (
		<form className="w-full max-w-lg" onSubmit={handleSubmit}>
			<WelcomeStepCard
				description={
					<>
						Bookmarks added to {normalizedFolderName || "this folder"} will
						automatically appear on Vivid Tab.
					</>
				}
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
							disabled={!normalizedFolderName || isCompleting}
							type="submit"
							variant="ghost"
						>
							{isCompleting ? "FINISHING..." : "FINISH"}
							<IconChevronRight />
						</Button>
					</>
				}
				title="Create Bookmark Folder"
			>
				<label className="sr-only" htmlFor="bookmark-folder-name">
					Bookmark folder name
				</label>
				<Input
					autoComplete="off"
					autoFocus
					disabled={isCompleting}
					id="bookmark-folder-name"
					onChange={(event) => {
						createdFolderIdRef.current = undefined;
						setBookmarkFolderName(event.target.value);
					}}
					value={bookmarkFolderName}
				/>
			</WelcomeStepCard>
		</form>
	);
};

export { CreateNewBookmarkFolder };
