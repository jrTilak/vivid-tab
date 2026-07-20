import { SearchIcon } from "lucide-react";
import { useState } from "react";
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
					"flex items-center space-x-2 w-full mx-auto cursor-text group transition-all relative duration-100",
					isOpen ? "-top-96" : "top-0",
				)}
			>
				<button
					type="button"
					onClick={() => setIsOpen(true)}
					className={cn(
						"grow flex h-10 w-full rounded-md border border-input bg-background/80 backdrop-blur-xl px-3 py-2 text-base md:text-sm relative group-hover:border-accent group-hover:shadow-lg",
					)}
				>
					<span className="text-muted-foreground">
						Search the web... ( Ctrl+, ) or ( Cmd+, )
					</span>
					<SearchIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
				</button>
				<PopularApps />
			</div>
		</>
	);
};

export { Searchbar };
