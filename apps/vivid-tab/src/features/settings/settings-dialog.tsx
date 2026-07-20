import {
	IconClock,
	IconCloud,
	IconDevices,
	IconHeartHandshake,
	IconHistory,
	IconLayoutGrid,
	IconListCheck,
	IconPalette,
	IconPhoto,
	IconPhotoPlus,
	IconQuote,
	IconSearch,
} from "@tabler/icons-react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { useSettings } from "@/providers/settings-provider";
import AppearanceSettings from "./tabs/appearance";
import BackgroundSettings from "./tabs/background";
import BackupAndExportSettings from "./tabs/backup-and-export";
import GeneralSettings from "./tabs/general";
import LayoutsSettings from "./tabs/layouts";
import QuotesSettings from "./tabs/quotes";
import SearchbarSettings from "./tabs/searchbar";
import Support from "./tabs/support";
import TemperatureSettings from "./tabs/temperature";
import TimerSettings from "./tabs/timer";
import TodosSettings from "./tabs/todos";
import WallpaperSettings from "./tabs/wallpapers";

type SettingsDialogProps = {
	onOpenChange: (open: boolean) => void;
	onOpenReviewDialog: () => void;
};

type SettingsTabId =
	| "appearance"
	| "background"
	| "backup"
	| "general"
	| "layout"
	| "quotes"
	| "searchbar"
	| "support"
	| "temperature"
	| "timer"
	| "todos"
	| "wallpaper";

const SETTINGS_GROUPS = [
	{
		label: "General",
		tabs: [{ icon: IconDevices, id: "general", label: "General" }],
	},
	{
		label: "Appearance",
		tabs: [
			{ icon: IconPalette, id: "appearance", label: "Appearance" },
			{ icon: IconLayoutGrid, id: "layout", label: "Layout" },
			{ icon: IconPhotoPlus, id: "wallpaper", label: "Wallpaper" },
			{ icon: IconPhoto, id: "background", label: "Background" },
		],
	},
	{
		label: "Widgets",
		tabs: [
			{ icon: IconSearch, id: "searchbar", label: "Search bar" },
			{ icon: IconClock, id: "timer", label: "Timer" },
			{ icon: IconCloud, id: "temperature", label: "Weather" },
			{ icon: IconQuote, id: "quotes", label: "Quotes" },
			{ icon: IconListCheck, id: "todos", label: "Todos" },
		],
	},
	{
		label: "Data",
		tabs: [{ icon: IconHistory, id: "backup", label: "Backup & export" }],
	},
	{
		label: "Help",
		tabs: [{ icon: IconHeartHandshake, id: "support", label: "Support" }],
	},
] as const satisfies ReadonlyArray<{
	label: string;
	tabs: ReadonlyArray<{
		icon: typeof IconDevices;
		id: SettingsTabId;
		label: string;
	}>;
}>;

const SettingsDialog = ({
	onOpenChange,
	onOpenReviewDialog,
}: SettingsDialogProps) => {
	const { setSettings, settings } = useSettings();
	const settingsSnapshotRef = useRef(settings);
	const [activeTabId, setActiveTabId] = useState<SettingsTabId>("general");

	const handleOpenReviewDialog = useCallback(() => {
		onOpenChange(false);
		onOpenReviewDialog();
	}, [onOpenChange, onOpenReviewDialog]);

	const panels: Record<SettingsTabId, React.ReactNode> = {
		appearance: <AppearanceSettings />,
		background: <BackgroundSettings />,
		backup: <BackupAndExportSettings />,
		general: <GeneralSettings />,
		layout: <LayoutsSettings />,
		quotes: <QuotesSettings />,
		searchbar: <SearchbarSettings />,
		support: <Support onOpenReviewDialog={handleOpenReviewDialog} />,
		temperature: <TemperatureSettings />,
		timer: <TimerSettings />,
		todos: <TodosSettings />,
		wallpaper: <WallpaperSettings />,
	};

	return (
		<DialogContent className="grid h-[min(42rem,90vh)] w-[90vw] min-w-lg max-w-[90vw] grid-cols-[14rem_minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 lg:max-w-5xl">
			<aside className="row-span-3 min-h-0 overflow-y-auto border-r bg-muted in-data-[visual-effect=opaque]:bg-muted in-data-[visual-effect=translucent]:bg-muted/30">
				<nav aria-label="Settings sections" className="space-y-5 p-3">
					{SETTINGS_GROUPS.map((group) => (
						<div className="space-y-1" key={group.label}>
							<p className="px-3 text-[0.6875rem] font-medium tracking-wider text-muted-foreground uppercase">
								{group.label}
							</p>
							{group.tabs.map((tab) => (
								<Button
									className={cn(
										"w-full justify-start gap-2 px-3 text-muted-foreground",
										activeTabId === tab.id &&
											"bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
									)}
									key={tab.id}
									onClick={() => setActiveTabId(tab.id)}
									variant="ghost"
								>
									<tab.icon className="size-4" />
									{tab.label}
								</Button>
							))}
						</div>
					))}
				</nav>
			</aside>

			<DialogHeader className="col-start-2 border-b px-5 py-4">
				<DialogTitle>Settings</DialogTitle>
			</DialogHeader>

			<div className="col-start-2 min-h-0 overflow-y-auto">
				{panels[activeTabId]}
			</div>

			<DialogFooter className="col-start-2 border-t px-5 py-3">
				<Button
					onClick={() => {
						setSettings(settingsSnapshotRef.current);
						onOpenChange(false);
					}}
					variant="ghost"
				>
					Cancel
				</Button>
				<Button className="min-w-28" onClick={() => onOpenChange(false)}>
					Save
				</Button>
			</DialogFooter>
		</DialogContent>
	);
};

export default SettingsDialog;
