import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type WallpaperSelectionDialogProps = {
	onConfirm: () => void;
	onOpenChange: (open: boolean) => void;
	open: boolean;
};

/** Confirms the explicit wallpaper choice that disables automatic rotation. */
const WallpaperSelectionDialog = ({
	onConfirm,
	onOpenChange,
	open,
}: WallpaperSelectionDialogProps) => (
	<AlertDialog onOpenChange={onOpenChange} open={open}>
		<AlertDialogContent>
			<AlertDialogHeader>
				<AlertDialogTitle>Set this wallpaper?</AlertDialogTitle>
				<AlertDialogDescription>
					This will use the selected wallpaper and turn off automatic wallpaper
					rotation.
				</AlertDialogDescription>
			</AlertDialogHeader>
			<AlertDialogFooter>
				<AlertDialogCancel>Cancel</AlertDialogCancel>
				<AlertDialogAction onClick={onConfirm}>Set wallpaper</AlertDialogAction>
			</AlertDialogFooter>
		</AlertDialogContent>
	</AlertDialog>
);

export default WallpaperSelectionDialog;
