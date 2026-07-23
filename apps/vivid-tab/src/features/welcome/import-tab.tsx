import {
	IconChevronLeft,
	IconChevronRight,
	IconCirclePlus,
	IconStar,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useWelcomeContext } from "./_context";
import { useCompleteWelcome } from "./use-complete-welcome";
import { WelcomeStepCard } from "./welcome-ui";

const ImportTab = () => {
	const { navigate } = useWelcomeContext();
	const { completeWelcome, errorMessage, isCompleting } = useCompleteWelcome();

	return (
		<WelcomeStepCard
			contentClassName="space-y-2"
			description="Select the import source for your bookmarks."
			errorMessage={errorMessage}
			footer={
				<>
					<Button
						disabled={isCompleting}
						onClick={() => navigate("WELCOME", "backward")}
						type="button"
						variant="ghost"
					>
						<IconChevronLeft />
						BACK
					</Button>
					<Button
						aria-busy={isCompleting}
						disabled={isCompleting}
						onClick={() => void completeWelcome()}
						type="button"
						variant="ghost"
					>
						{isCompleting ? "FINISHING..." : "SKIP"}
						<IconChevronRight />
					</Button>
				</>
			}
			title="Import Bookmarks"
		>
			<Button
				className="min-h-14 w-full justify-start whitespace-normal border-transparent py-3 text-left dark:border-input"
				disabled={isCompleting}
				onClick={() => navigate("CREATE_NEW_BOOKMARK_FOLDER", "forward")}
				type="button"
				variant="outline"
				size="lg"
			>
				<IconCirclePlus />
				<span className="leading-snug">Create a new bookmark folder</span>
				<IconChevronRight className="ml-auto text-muted-foreground" />
			</Button>
			<Button
				size="lg"
				className="min-h-14 w-full justify-start whitespace-normal border-transparent py-3 text-left dark:border-input"
				disabled={isCompleting}
				onClick={() => navigate("IMPORT_FROM_BROWSER_BOOKMARKS", "forward")}
				type="button"
				variant="outline"
			>
				<IconStar />
				<span className="leading-snug">Import from browser bookmarks</span>
				<IconChevronRight className="ml-auto text-muted-foreground" />
			</Button>
		</WelcomeStepCard>
	);
};

export { ImportTab };
