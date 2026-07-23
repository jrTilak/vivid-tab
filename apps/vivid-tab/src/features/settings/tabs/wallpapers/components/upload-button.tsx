import { IconUpload } from "@tabler/icons-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const UploadButton = ({ onUpload }: { onUpload: (file: File) => void }) => (
	<label
		className={cn(
			buttonVariants({ variant: "outline" }),
			"h-48 w-full cursor-pointer flex-col text-muted-foreground hover:text-foreground",
		)}
	>
		<IconUpload className="mb-2 size-8" />
		<span>Upload image</span>
		<input
			accept="image/*"
			className="sr-only"
			onChange={(event) => {
				const file = event.currentTarget.files?.[0];
				if (file) {
					onUpload(file);
					event.currentTarget.value = "";
				}
			}}
			type="file"
		/>
	</label>
);

export default UploadButton;
