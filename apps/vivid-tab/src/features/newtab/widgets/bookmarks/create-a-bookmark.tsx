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
import { saveBookmark } from "./bookmark-editor-service";
import { BookmarkIconPicker } from "./bookmark-icon-picker";
import { useBookmarkEditorIcon } from "./use-bookmark-editor-icon";

type Props = {
	parentId?: string;
	defaultValues?: {
		url: string;
		title: string;
		id: string;
	};
	open: boolean;
	setOpen: (open: boolean) => void;
};

const CreateABookmark = ({ parentId, defaultValues, open, setOpen }: Props) => {
	const titleInputId = useId();
	const urlInputId = useId();
	const [value, setValue] = useState({
		title: defaultValues?.title ?? "",
		url: defaultValues?.url ?? "",
	});
	const [errorMessage, setErrorMessage] = useState<string>();
	const [isReadingIcon, setIsReadingIcon] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const { icon, iconLoadError, isLoadingIcon, setIcon } = useBookmarkEditorIcon(
		{ bookmarkId: defaultValues?.id, open },
	);
	const isBusy = isSaving || isLoadingIcon || isReadingIcon;

	useEffect(() => {
		if (!open) return;

		setValue({
			title: defaultValues?.title ?? "",
			url: defaultValues?.url ?? "",
		});
		setErrorMessage(undefined);
	}, [defaultValues?.title, defaultValues?.url, open]);

	const handleOpenChange = (nextOpen: boolean) => {
		if (isSaving && !nextOpen) return;
		if (!nextOpen) {
			setValue({
				title: defaultValues?.title ?? "",
				url: defaultValues?.url ?? "",
			});
			setErrorMessage(undefined);
		}
		setOpen(nextOpen);
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const title = value.title.trim();
		const url = value.url.trim();
		if (!title || !url || isBusy) return;

		setErrorMessage(undefined);
		setIsSaving(true);

		try {
			await saveBookmark({
				bookmarkId: defaultValues?.id,
				icon,
				parentId,
				title,
				url,
			});
			setValue({ title: "", url: "" });
			setIcon(null);
			setOpen(false);
		} catch (error) {
			console.error("Failed to save bookmark:", error);
			setErrorMessage("Could not save this bookmark. Please try again.");
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
							{defaultValues ? "Edit bookmark" : "Create a bookmark"}
						</DialogTitle>
						<DialogDescription>
							{defaultValues
								? "Update this bookmark's name, address, or custom icon."
								: "Enter the name and address of the bookmark to create."}
						</DialogDescription>
					</DialogHeader>
					<div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
						<div className="grid gap-2">
							<Label htmlFor={titleInputId}>Name</Label>
							<Input
								autoFocus
								disabled={isSaving}
								id={titleInputId}
								onChange={(event) =>
									setValue((currentValue) => ({
										...currentValue,
										title: event.target.value,
									}))
								}
								placeholder="Name"
								value={value.title}
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
					<div className="grid gap-2">
						<Label htmlFor={urlInputId}>Address</Label>
						<Input
							disabled={isSaving}
							id={urlInputId}
							onChange={(event) =>
								setValue((currentValue) => ({
									...currentValue,
									url: event.target.value,
								}))
							}
							placeholder="https://… or file://…"
							type="url"
							value={value.url}
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
							disabled={isBusy || !value.title.trim() || !value.url.trim()}
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

export { CreateABookmark };
