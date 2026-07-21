import { IconSearch } from "@tabler/icons-react";
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
			<DialogContent className="w-[min(90vw,34rem)] max-w-[min(90vw,34rem)] pt-14">
				<DialogTitle className="sr-only">Search the web</DialogTitle>
				<DialogDescription className="sr-only">
					Search directly or use one of your enabled shortcuts.
				</DialogDescription>

				<div className="flex flex-col items-center justify-center gap-4">
					<form
						className="mx-auto flex h-10 w-full max-w-[500px] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-6 motion-safe:duration-200"
						onSubmit={(event) => {
							event.preventDefault();
							runSearch(
								resolveDefaultSearchQuery(
									searchbar.submitDefaultAction,
									searchQuery,
								),
							);
						}}
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
					</form>

					<div className="mx-auto grid w-full max-w-[500px] grid-cols-2 gap-2 sm:grid-cols-4">
						{SEARCH_SHORTCUTS.filter((shortcut) =>
							searchbar.shortcuts.includes(shortcut.id),
						).map((shortcut, index) => (
							<div
								className="aspect-square w-full motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-6"
								key={shortcut.id}
								style={{
									animationDelay: `${index * 100 + 100}ms`,
									animationFillMode: "backwards",
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
							</div>
						))}
					</div>

					{searchQuery && searchbar.searchSuggestions && (
						<section
							aria-label="Search suggestions"
							className="mx-auto flex w-full max-w-[500px] flex-wrap gap-2 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-6 motion-safe:duration-200"
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
						</section>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default SearchDialog;
