import { IconSearch } from "@tabler/icons-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import SearchDialog from "@/features/dialogs/search";
import { cn } from "@/lib/cn";
import { PopularApps } from "./popular-apps";

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
				<div className="relative grow">
					<Input
						aria-expanded={isOpen}
						aria-haspopup="dialog"
						aria-label="Open search"
						className="cursor-pointer pr-10 text-muted-foreground shadow-lg sm:pr-24"
						onClick={() => setIsOpen(true)}
						onKeyDown={(event) => {
							if (event.key !== "Enter" && event.key !== " ") return;
							event.preventDefault();
							setIsOpen(true);
						}}
						placeholder="Search the web…"
						readOnly
					/>
					<span className="pointer-events-none absolute top-1/2 right-10 hidden -translate-y-1/2 text-xs opacity-70 sm:inline">
						Ctrl/⌘ + ,
					</span>
					<IconSearch className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
				</div>
				<PopularApps />
			</div>
		</>
	);
};

export { Searchbar };
