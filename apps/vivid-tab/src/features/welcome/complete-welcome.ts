type TabReference = { id?: number };

export type RootFolderResolver = () =>
	| Promise<string | undefined>
	| string
	| undefined;

type WelcomeCompletionOptions = {
	resolveRootFolder?: RootFolderResolver;
	persistRootFolder: (rootFolderId: string) => Promise<boolean>;
	getWelcomeTab: () => Promise<TabReference | undefined>;
	openNewTab: () => Promise<TabReference>;
	closeWelcomeTab: (tabId: number) => Promise<void>;
};

/**
 * Runs onboarding completion in a strict order: resolve, persist, replace.
 * Keeping the browser operations injectable makes the failure-sensitive flow
 * independently testable without mounting React or mocking the Chrome global.
 */
export const runWelcomeCompletion = async ({
	resolveRootFolder,
	persistRootFolder,
	getWelcomeTab,
	openNewTab,
	closeWelcomeTab,
}: WelcomeCompletionOptions): Promise<void> => {
	const welcomeTab = await getWelcomeTab();
	const rootFolderId = await resolveRootFolder?.();

	if (rootFolderId !== undefined) {
		const wasSaved = await persistRootFolder(rootFolderId);

		if (!wasSaved) {
			throw new Error("The selected bookmark folder was not saved");
		}
	}

	const nextTab = await openNewTab();

	if (welcomeTab?.id != null && welcomeTab.id !== nextTab.id) {
		await closeWelcomeTab(welcomeTab.id);
	}
};
