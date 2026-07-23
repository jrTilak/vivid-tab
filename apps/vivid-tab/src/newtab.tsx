import { useState } from "react";
import { AskForReview } from "@/components/ask-for-review";
import Homepage from "@/features/newtab";
import { Settings } from "@/features/settings";
import { RootProvider } from "@/providers/root-provider";

function NewtabPage() {
	const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

	return (
		<RootProvider ensureRootFolder>
			<AskForReview
				open={isReviewDialogOpen}
				onOpenChange={setIsReviewDialogOpen}
			/>
			<Homepage />
			<div className="flex items-center justify-center gap-4 fixed top-4 right-4">
				<Settings onOpenReviewDialog={() => setIsReviewDialogOpen(true)} />
			</div>
		</RootProvider>
	);
}

export default NewtabPage;
