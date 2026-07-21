import { IconSearch } from "@tabler/icons-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@/components/ui/input-group";
import { Link } from "@/components/ui/link";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useSearchSuggestions } from "@/hooks/use-search-suggestions";
import { resolveBangSearch } from "@/lib/bang-search";
import { useSettings } from "@/providers/settings-provider";
import { submitSearch } from "./search-service";

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
	const activeSearch = resolveBangSearch(searchQuery);
	const debouncedSearch = resolveBangSearch(debouncedSearchQuery);
	const searchSuggestions = useSearchSuggestions({
		enabled: Boolean(
			open && debouncedSearch.query && searchbar.searchSuggestions,
		),
		query: debouncedSearch.query,
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
	return (
		<Dialog onOpenChange={handleOpenChange} open={open}>
			<DialogContent className="top-[30%] w-[min(90vw,34rem)] max-w-[min(90vw,34rem)] pt-10">
				<DialogTitle className="sr-only">Search the web</DialogTitle>
				<DialogDescription className="sr-only">
					Search directly or use a bang shortcut such as !yt.
				</DialogDescription>

				<div className="flex flex-col items-center justify-center gap-4">
					<form
						className="mx-auto w-full max-w-[500px] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-6 motion-safe:duration-200"
						onSubmit={(event) => {
							event.preventDefault();
							runSearch(searchQuery);
						}}
					>
						<InputGroup>
							{activeSearch.kind === "bang" && (
								<InputGroupAddon
									className="max-w-28"
									title={`Search with ${activeSearch.bang.name}`}
								>
									{activeSearch.bang.icon ? (
										<img
											alt=""
											aria-hidden="true"
											draggable={false}
											src={chrome.runtime.getURL(activeSearch.bang.icon)}
										/>
									) : (
										<span className="truncate">{activeSearch.bang.name}</span>
									)}
								</InputGroupAddon>
							)}
							<InputGroupInput
								autoComplete="off"
								autoFocus
								id="vivid-search-bar"
								onChange={(event) => setSearchQuery(event.target.value)}
								placeholder="Search the web…"
								value={searchQuery}
							/>
							<InputGroupButton
								aria-label="Search"
								disabled={!searchQuery.trim()}
								type="submit"
							>
								<IconSearch />
							</InputGroupButton>
						</InputGroup>
					</form>

					<p className="text-center text-muted-foreground text-xs">
						Bangs are supported. Try <code>!yt lo-fi</code> or{" "}
						<code>react !gh</code>.{" "}
						<Link
							href="https://github.com/kagisearch/bangs"
							rel="noopener noreferrer"
							target="_blank"
						>
							See supported bangs
						</Link>
					</p>

					{debouncedSearch.query && searchbar.searchSuggestions && (
						<section
							aria-label="Search suggestions"
							className="mx-auto flex w-full max-w-[500px] flex-wrap gap-2 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-6 motion-safe:duration-200"
						>
							{searchSuggestions.slice(0, 5).map((result) => (
								<Button
									className="max-w-full truncate font-normal"
									key={result}
									onClick={() => {
										if (debouncedSearch.kind !== "bang") {
											runSearch(result);
											return;
										}

										runSearch(
											debouncedSearch.position === "leading"
												? `!${debouncedSearch.trigger} ${result}`
												: `${result} !${debouncedSearch.trigger}`,
										);
									}}
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
