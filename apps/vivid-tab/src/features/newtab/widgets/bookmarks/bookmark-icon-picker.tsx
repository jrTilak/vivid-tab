import { IconCloudUpload, IconX } from "@tabler/icons-react";
import { type ChangeEvent, useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { readIconFile } from "./bookmark-editor-service";

type BookmarkIconPickerProps = {
	disabled?: boolean;
	icon: string | null;
	onError: (message?: string) => void;
	onIconChange: (icon: string | null) => void;
	onReadingChange: (isReading: boolean) => void;
};

/** Shared accessible image picker for bookmark and folder custom icons. */
const BookmarkIconPicker = ({
	disabled,
	icon,
	onError,
	onIconChange,
	onReadingChange,
}: BookmarkIconPickerProps) => {
	const inputId = useId();
	const inputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
		const input = event.currentTarget;
		const file = input.files?.[0];
		if (!file) return;

		onError(undefined);
		onReadingChange(true);

		try {
			onIconChange(await readIconFile(file));
		} catch (error) {
			console.error("Failed to read custom bookmark icon:", error);
			onError("Could not use that image. Please choose another image file.");
		} finally {
			// Allow selecting the same file again after removing or fixing it.
			input.value = "";
			onReadingChange(false);
		}
	};

	return (
		<div className="group relative size-12 shrink-0">
			<Button
				aria-controls={inputId}
				aria-label={icon ? "Replace custom icon" : "Choose a custom icon"}
				className="size-12 overflow-hidden p-0"
				disabled={disabled}
				onClick={() => inputRef.current?.click()}
				size="icon-lg"
				type="button"
				variant="outline"
			>
				{icon ? (
					<img
						alt=""
						aria-hidden="true"
						className="size-full object-contain object-center"
						draggable={false}
						src={icon}
					/>
				) : (
					<IconCloudUpload className="size-5" />
				)}
			</Button>
			<input
				accept="image/*"
				aria-label="Custom icon image file"
				className="hidden"
				disabled={disabled}
				id={inputId}
				onChange={(event) => void handleFileChange(event)}
				ref={inputRef}
				type="file"
			/>
			{icon && (
				<Button
					aria-label="Remove custom icon"
					className="absolute -top-2 -right-2 size-6 shadow-sm"
					disabled={disabled}
					onClick={() => {
						onError(undefined);
						onIconChange(null);
					}}
					size="icon-xs"
					type="button"
					variant="secondary"
				>
					<IconX />
				</Button>
			)}
		</div>
	);
};

export { BookmarkIconPicker };
