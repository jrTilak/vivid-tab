import { useCallback, useRef, useState } from "react";
import { useSettings } from "@/providers/settings-provider";
import {
	type RootFolderResolver,
	runWelcomeCompletion,
} from "./complete-welcome";

/**
 * Completes onboarding as a guarded, ordered transaction.
 *
 * The synchronous ref blocks duplicate clicks before React can render the pending
 * state. Settings are persisted before the replacement tab opens, and the welcome
 * tab is closed only after the new tab has been created successfully.
 */
export const useCompleteWelcome = () => {
	const { saveSettings, settings } = useSettings();
	const inFlightRef = useRef(false);
	const [isCompleting, setIsCompleting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string>();

	const completeWelcome = useCallback(
		async (resolveRootFolder?: RootFolderResolver) => {
			if (inFlightRef.current) return false;

			inFlightRef.current = true;
			setIsCompleting(true);
			setErrorMessage(undefined);

			try {
				await runWelcomeCompletion({
					resolveRootFolder,
					persistRootFolder: (rootFolderId) =>
						saveSettings({
							...settings,
							general: {
								...settings.general,
								rootFolder: rootFolderId,
							},
						}),
					getWelcomeTab: () => chrome.tabs.getCurrent(),
					openNewTab: () => chrome.tabs.create({}),
					closeWelcomeTab: (tabId) => chrome.tabs.remove(tabId),
				});

				return true;
			} catch (error) {
				console.error("Failed to complete Vivid Tab onboarding:", error);
				setErrorMessage("Could not finish setup. Please try again.");

				return false;
			} finally {
				inFlightRef.current = false;
				setIsCompleting(false);
			}
		},
		[saveSettings, settings],
	);

	return { completeWelcome, errorMessage, isCompleting };
};
