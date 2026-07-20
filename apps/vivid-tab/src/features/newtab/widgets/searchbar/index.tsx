import { IconSearch } from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { PopularApps } from "./popular-apps";
import SearchDialog from "./search-dialog";

const Searchbar = () => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<SearchDialog onOpenChange={setIsOpen} open={isOpen} />
			<div
				className={cn(
					"relative mx-auto flex w-full items-center gap-2 transition-[transform,opacity] duration-200",
					isOpen && "pointer-events-none -translate-y-96 opacity-0",
				)}
			>
				<Button
					aria-expanded={isOpen}
					aria-haspopup="dialog"
					className="h-10 grow justify-start px-3 text-muted-foreground shadow-lg"
					onClick={() => setIsOpen(true)}
					type="button"
					variant="outline"
				>
					<span>Search the web…</span>
					<span className="ml-auto hidden text-xs opacity-70 sm:inline">
						Ctrl/⌘ + ,
					</span>
					<IconSearch />
				</Button>
				<PopularApps />
			</div>
		</>
	);
};

export { Searchbar };
