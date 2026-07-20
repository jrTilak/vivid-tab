import { IconSettings } from "@tabler/icons-react";
import { lazy, Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";

const SettingsDialog = lazy(() => import("./settings-dialog"));

type SettingsProps = {
	onOpenReviewDialog: () => void;
};

/** Keeps the full settings panel out of the new-tab startup bundle. */
const Settings = ({ onOpenReviewDialog }: SettingsProps) => {
	const [open, setOpen] = useState(false);

	return (
		<Dialog onOpenChange={setOpen} open={open}>
			<DialogTrigger asChild>
				<Button
					aria-label="Open settings"
					className="text-background dark:text-foreground"
					onFocus={() => void import("./settings-dialog")}
					onPointerEnter={() => void import("./settings-dialog")}
					size="icon"
					variant="ghost"
				>
					<IconSettings className="size-5 opacity-90" />
				</Button>
			</DialogTrigger>

			{open && (
				<Suspense fallback={null}>
					<SettingsDialog
						onOpenChange={setOpen}
						onOpenReviewDialog={onOpenReviewDialog}
					/>
				</Suspense>
			)}
		</Dialog>
	);
};

export { Settings };
