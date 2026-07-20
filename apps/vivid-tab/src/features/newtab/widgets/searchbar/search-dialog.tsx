import { IconSearch } from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useSearchSuggestions } from "@/hooks/use-search-suggestions";
import { useSettings } from "@/providers/settings-provider";
import { submitSearch } from "./search-service";
import {
	buildShortcutQuery,
	resolveDefaultSearchQuery,
	SEARCH_SHORTCUTS,
	type SearchShortcutId,
} from "./search-shortcuts";

type Props = {
	onOpenChange: (open: boolean) => void;
	open: boolean;
};

const SearchDialog = ({ open, onOpenChange }: Props) => {
	const [searchQuery, setSearchQuery] = useState("");
	const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
	const {
		settings: {
			widgets: { searchbar },
			general,
		},
	} = useSettings();
	const searchSuggestions = useSearchSuggestions({
		enabled: Boolean(
			open && debouncedSearchQuery && searchbar.searchSuggestions,
		),
		query: debouncedSearchQuery,
	});

	const handleOpenChange = useCallback(
		(nextOpen: boolean) => {
			if (!nextOpen) setSearchQuery("");
			onOpenChange(nextOpen);
		},
		[onOpenChange],
	);

	const runSearch = useCallback(
		(query: string) => {
			if (submitSearch(query, general.openUrlIn)) handleOpenChange(false);
		},
		[general.openUrlIn, handleOpenChange],
	);

	const runShortcut = useCallback(
		(shortcutId: SearchShortcutId) => {
			runSearch(buildShortcutQuery(shortcutId, searchQuery));
		},
		[runSearch, searchQuery],
	);

	useHotkeys(
		["ctrl+comma", "meta+comma"],
		() => handleOpenChange(!open),
		{ enableOnFormTags: true, preventDefault: true },
		[handleOpenChange, open],
	);

	return (
		<Dialog onOpenChange={handleOpenChange} open={open}>
			<DialogContent className="w-[min(90vw,34rem)] max-w-[min(90vw,34rem)]">
				<DialogTitle className="sr-only">Search the web</DialogTitle>
				<DialogDescription className="sr-only">
					Search directly or use one of your enabled shortcuts.
				</DialogDescription>

				<div className="flex flex-col items-center justify-center gap-4">
					<motion.form
						animate={{ opacity: 1, y: 0 }}
						className="mx-auto flex h-10 w-full max-w-[500px]"
						exit={{ opacity: 0, y: 100 }}
						initial={{ opacity: 0, y: 100 }}
						onSubmit={(event) => {
							event.preventDefault();
							runSearch(
								resolveDefaultSearchQuery(
									searchbar.submitDefaultAction,
									searchQuery,
								),
							);
						}}
						transition={{ duration: 0.2 }}
					>
						<Input
							autoComplete="off"
							autoFocus
							className="h-10 rounded-r-none"
							id="vivid-search-bar"
							onChange={(event) => setSearchQuery(event.target.value)}
							placeholder="Search the web…"
							value={searchQuery}
						/>
						<Button
							aria-label="Search"
							className="h-10 rounded-l-none"
							disabled={!searchQuery.trim()}
							size="icon"
							type="submit"
							variant="secondary"
						>
							<IconSearch />
						</Button>
					</motion.form>

					<div className="mx-auto grid w-full max-w-[500px] grid-cols-2 gap-2 sm:grid-cols-4">
						{SEARCH_SHORTCUTS.filter((shortcut) =>
							searchbar.shortcuts.includes(shortcut.id),
						).map((shortcut, index) => (
							<motion.div
								animate={{ opacity: 1, y: 0 }}
								className="aspect-square w-full"
								exit={{ opacity: 0, y: 100 }}
								initial={{ opacity: 0, y: 100 }}
								key={shortcut.id}
								transition={{
									delay: index * 0.1 + 0.1,
									duration: 0.1,
								}}
							>
								<Button
									className="h-full w-full flex-col gap-1 border-border/30 py-5"
									onClick={() => runShortcut(shortcut.id)}
									type="button"
									variant={
										searchbar.dialogBackground === "transparent"
											? "outline"
											: "secondary"
									}
								>
									<img
										alt=""
										className="size-8"
										decoding="async"
										draggable={false}
										src={chrome.runtime.getURL(shortcut.icon)}
									/>
									<span className="text-sm">{shortcut.name}</span>
								</Button>
							</motion.div>
						))}
					</div>

					<AnimatePresence>
						{searchQuery && searchbar.searchSuggestions && (
							<motion.div
								animate={{ opacity: 1, y: 0 }}
								aria-label="Search suggestions"
								className="mx-auto flex w-full max-w-[500px] flex-wrap gap-2"
								exit={{ opacity: 0, y: 100 }}
								initial={{ opacity: 0, y: 100 }}
								key="search-suggestions"
								transition={{ duration: 0.2 }}
							>
								{searchSuggestions.slice(0, 5).map((result) => (
									<Button
										className="max-w-full truncate font-normal"
										key={result}
										onClick={() => runSearch(result)}
										size="xs"
										type="button"
										variant="secondary"
									>
										{result}
									</Button>
								))}
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default SearchDialog;
