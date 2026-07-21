import { IconSearch } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { EXTENSION_COMMANDS } from "@/constants/background-actions";
import { useCommandShortcut } from "@/features/dialogs/search/use-command-shortcut";
import { useNewtabSearch } from "@/features/newtab/newtab-search";
import { cn } from "@/lib/cn";
import { PopularApps } from "./popular-apps";

const Searchbar = () => {
	const { isOpen, openSearch } = useNewtabSearch();
	const shortcut = useCommandShortcut(EXTENSION_COMMANDS.TOGGLE_VIVID_SEARCH);

	return (
		<div
			className={cn(
				"relative mx-auto flex w-full items-center gap-2 transition-[transform,opacity] duration-200",
				isOpen && "pointer-events-none -translate-y-96 opacity-0",
			)}
		>
			<div className="relative grow">
				<Input
					aria-expanded={isOpen}
					aria-haspopup="dialog"
					aria-label="Open search"
					className="cursor-pointer pr-10 text-muted-foreground shadow-lg sm:pr-48"
					onClick={openSearch}
					onKeyDown={(event) => {
						if (event.key !== "Enter" && event.key !== " ") return;
						event.preventDefault();
						openSearch();
					}}
					placeholder="Search the web…"
					readOnly
				/>
				<span className="pointer-events-none absolute top-1/2 right-10 hidden -translate-y-1/2 text-xs opacity-70 sm:inline">
					{shortcut ?? "Unassigned"}
				</span>
				<IconSearch className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
			</div>
			<PopularApps />
		</div>
	);
};

export { Searchbar };
