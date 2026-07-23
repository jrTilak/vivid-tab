import type React from "react";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveBookmarkFolder } from "./bookmark-editor-service";
import { BookmarkIconPicker } from "./bookmark-icon-picker";
import { useBookmarkEditorIcon } from "./use-bookmark-editor-icon";

type Props = {
	parentId?: string;
	defaultValues?: {
		title: string;
		id: string;
	};
	open: boolean;
	setOpen: (open: boolean) => void;
};

const CreateAFolder = ({ parentId, defaultValues, open, setOpen }: Props) => {
	const titleInputId = useId();
	const [title, setTitle] = useState(defaultValues?.title ?? "");
	const [errorMessage, setErrorMessage] = useState<string>();
	const [isReadingIcon, setIsReadingIcon] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const { icon, iconLoadError, isLoadingIcon, setIcon } = useBookmarkEditorIcon(
		{ bookmarkId: defaultValues?.id, open },
	);
	const isBusy = isSaving || isLoadingIcon || isReadingIcon;

	useEffect(() => {
		if (!open) return;

		setTitle(defaultValues?.title ?? "");
		setErrorMessage(undefined);
	}, [defaultValues?.title, open]);

	const handleOpenChange = (nextOpen: boolean) => {
		if (isSaving && !nextOpen) return;
		if (!nextOpen) {
			setTitle(defaultValues?.title ?? "");
			setErrorMessage(undefined);
		}
		setOpen(nextOpen);
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const nextTitle = title.trim();
		if (!nextTitle || isBusy) return;

		setErrorMessage(undefined);
		setIsSaving(true);

		try {
			await saveBookmarkFolder({
				bookmarkId: defaultValues?.id,
				icon,
				parentId,
				title: nextTitle,
			});
			setTitle("");
			setIcon(null);
			setOpen(false);
		} catch (error) {
			console.error("Failed to save bookmark folder:", error);
			setErrorMessage("Could not save this folder. Please try again.");
		} finally {
			setIsSaving(false);
		}
	};

	const visibleError = errorMessage ?? iconLoadError;

	return (
		<Dialog onOpenChange={handleOpenChange} open={open}>
			<DialogContent className="sm:max-w-[425px]">
				<form
					aria-busy={isBusy}
					className="grid gap-6"
					onSubmit={(event) => void handleSubmit(event)}
				>
					<DialogHeader>
						<DialogTitle>
							{defaultValues
								? "Edit bookmark folder"
								: "Create a bookmark folder"}
						</DialogTitle>
						<DialogDescription>
							{defaultValues
								? "Update this folder's name or custom icon."
								: "Enter the name of the folder to create."}
						</DialogDescription>
					</DialogHeader>
					<div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
						<div className="grid gap-2">
							<Label htmlFor={titleInputId}>Name</Label>
							<Input
								autoFocus
								disabled={isSaving}
								id={titleInputId}
								onChange={(event) => setTitle(event.target.value)}
								placeholder="Bookmarks"
								value={title}
							/>
						</div>
						<BookmarkIconPicker
							disabled={isBusy}
							icon={icon ?? null}
							onError={setErrorMessage}
							onIconChange={setIcon}
							onReadingChange={setIsReadingIcon}
						/>
					</div>
					{visibleError && (
						<p className="text-sm text-destructive" role="alert">
							{visibleError}
						</p>
					)}
					<DialogFooter>
						<Button
							className="min-w-32"
							disabled={isBusy || !title.trim()}
							type="submit"
						>
							{isSaving ? "Saving…" : "Save"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};

export { CreateAFolder };
