import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import SearchDialog from "@/features/dialogs/search";
import { useToggleSearchCommand } from "@/features/dialogs/search/use-toggle-search-command";

type NewtabSearchState = {
	isOpen: boolean;
	openSearch: () => void;
};

const NewtabSearchContext = createContext<NewtabSearchState | null>(null);

/**
 * Owns the New Tab search dialog independently from the optional search widget.
 * This keeps the browser command available for every valid widget layout.
 */
const NewtabSearchProvider = ({ children }: { children: ReactNode }) => {
	const [isOpen, setIsOpen] = useState(false);
	const openSearch = useCallback(() => setIsOpen(true), []);
	const toggleSearch = useCallback(() => setIsOpen((open) => !open), []);
	const value = useMemo(() => ({ isOpen, openSearch }), [isOpen, openSearch]);
	useToggleSearchCommand(toggleSearch);

	return (
		<NewtabSearchContext.Provider value={value}>
			<SearchDialog onOpenChange={setIsOpen} open={isOpen} />
			{children}
		</NewtabSearchContext.Provider>
	);
};

const useNewtabSearch = () => {
	const context = useContext(NewtabSearchContext);
	if (!context) {
		throw new Error("useNewtabSearch must be used within NewtabSearchProvider");
	}

	return context;
};

export { NewtabSearchProvider, useNewtabSearch };
