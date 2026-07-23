import { useEffect, useState } from "react";
import { loadBookmarkIcon } from "./bookmark-editor-service";

type UseBookmarkEditorIconProps = {
	bookmarkId?: string;
	open: boolean;
};

/** Keeps editor icon state synchronized without mounting a permanent icon listener. */
export const useBookmarkEditorIcon = ({
	bookmarkId,
	open,
}: UseBookmarkEditorIconProps) => {
	const [icon, setStoredIcon] = useState<string | null | undefined>(
		bookmarkId ? undefined : null,
	);
	const [isLoadingIcon, setIsLoadingIcon] = useState(false);
	const [iconLoadError, setIconLoadError] = useState<string>();

	useEffect(() => {
		let isCurrent = true;

		if (!open) {
			setStoredIcon(bookmarkId ? undefined : null);
			setIconLoadError(undefined);
			setIsLoadingIcon(false);
			return () => {
				isCurrent = false;
			};
		}

		if (!bookmarkId) {
			setStoredIcon(null);
			setIconLoadError(undefined);
			setIsLoadingIcon(false);
			return () => {
				isCurrent = false;
			};
		}

		setStoredIcon(undefined);
		setIconLoadError(undefined);
		setIsLoadingIcon(true);

		void loadBookmarkIcon(bookmarkId)
			.then((storedIcon) => {
				if (isCurrent) setStoredIcon(storedIcon);
			})
			.catch((error: unknown) => {
				console.error("Failed to load bookmark icon:", error);
				if (isCurrent) {
					setIconLoadError(
						"The current custom icon could not be loaded. Other changes can still be saved.",
					);
				}
			})
			.finally(() => {
				if (isCurrent) setIsLoadingIcon(false);
			});

		return () => {
			isCurrent = false;
		};
	}, [bookmarkId, open]);

	const setIcon = (nextIcon: string | null) => {
		setStoredIcon(nextIcon);
		setIconLoadError(undefined);
	};

	return { icon, iconLoadError, isLoadingIcon, setIcon };
};
