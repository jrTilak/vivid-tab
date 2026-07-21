import { $, $$, browser, expect } from "@wdio/globals";
import {
	type BookmarkNode,
	createBookmark,
	createBookmarkFolder,
	getExtensionPageUrl,
	getWindowUrls,
	openExtensionPage,
	readBookmarkTree,
	readLocalStorage,
	readSettings,
	resetExtensionState,
	waitForExtensionPage,
} from "../support/extension";

type BrowserName = "chromium" | "firefox";

const DEFAULT_ROOT_FOLDER_TITLE = "Vivid Tab";
const INSTALLED_DATE_KEY = "vivid-tab.installed-date";

const byAccessibleName = (name: string) => $(`aria/${name}`);

const flattenBookmarkTree = (nodes: readonly BookmarkNode[]): BookmarkNode[] =>
	nodes.flatMap((node) => [node, ...flattenBookmarkTree(node.children ?? [])]);

const findFoldersByTitle = (nodes: readonly BookmarkNode[], title: string) =>
	flattenBookmarkTree(nodes).filter(
		(node) => node.url === undefined && node.title === title,
	);

const findBookmarkNode = (nodes: readonly BookmarkNode[], id: string) =>
	flattenBookmarkTree(nodes).find((node) => node.id === id);

const assertSingleReplacementTab = async () => {
	const newtabUrl = await getExtensionPageUrl("newtab");
	const welcomeUrl = await getExtensionPageUrl("welcome");

	await waitForExtensionPage("newtab");
	await browser.waitUntil(
		async () => {
			const urls = await getWindowUrls();

			return (
				urls.filter((url) => url === welcomeUrl).length === 0 &&
				urls.filter((url) => url === newtabUrl).length === 1
			);
		},
		{
			interval: 100,
			timeout: 10_000,
			timeoutMsg:
				"Welcome was not replaced by exactly one Vivid Tab new-tab page",
		},
	);

	const urls = await getWindowUrls();
	expect(urls.filter((url) => url === welcomeUrl)).toHaveLength(0);
	expect(urls.filter((url) => url === newtabUrl)).toHaveLength(1);

	/* Re-select the surviving replacement after polling closing tab handles. */
	await waitForExtensionPage("newtab");
	await expect(browser).toHaveUrl(newtabUrl);
	await expect(byAccessibleName("Open settings")).toBeDisplayed();
};

const openImportStep = async () => {
	await openExtensionPage("welcome");
	await expect(byAccessibleName("Hi, I'm Vivid!")).toBeDisplayed();
	await byAccessibleName("START").click();
	await expect(byAccessibleName("Import Bookmarks")).toBeDisplayed();
};

const chooseImportFolder = async (title: string, optionIndex = 0) => {
	const trigger = $("#browser-bookmark-folder");
	await expect(trigger).toBeEnabled();
	await trigger.click();

	const selector = `//div[@role='option'][contains(., '${title}')]`;
	await browser.waitUntil(
		async () => {
			const options = await $$(selector);

			return (await options.length) > optionIndex;
		},
		{
			interval: 50,
			timeout: 5_000,
			timeoutMsg: `Bookmark folder option was not rendered: ${title}`,
		},
	);
	const option = (await $$(selector))[optionIndex];
	if (!option) throw new Error(`Bookmark folder option was missing: ${title}`);
	await expect(option).toBeDisplayed();
	await option.click();
};

const finishWithoutImporting = async () => {
	await openImportStep();
	await byAccessibleName("SKIP").click();
	await assertSingleReplacementTab();
};

const removeBookmarkTree = async (folderId: string) => {
	const result = await browser.executeAsync<
		{ error?: string; ok: boolean },
		[string]
	>((id, done) => {
		chrome.bookmarks.removeTree(id, () => {
			const error = chrome.runtime.lastError;
			done(error ? { error: error.message, ok: false } : { ok: true });
		});
	}, folderId);

	if (!result.ok) {
		throw new Error(
			result.error ?? `Unable to delete bookmark folder ${folderId}`,
		);
	}
};

const waitForPersistedRoot = async (expectedRootFolderId?: string) => {
	await browser.waitUntil(
		async () => {
			const rootFolderId = (await readSettings()).general.rootFolder;

			return expectedRootFolderId
				? rootFolderId === expectedRootFolderId
				: rootFolderId.length > 0;
		},
		{
			interval: 50,
			timeout: 5_000,
			timeoutMsg: "The resolved root bookmark folder was not persisted",
		},
	);
};

/** Runs the same onboarding contract against both packaged browser targets. */
export const runWelcomeSuite = (browserName: BrowserName) => {
	describe(`Welcome journeys (${browserName})`, () => {
		let pristineInstallState:
			| {
					installedDate: unknown;
					welcomeUrls: string[];
					welcomeUrl: string;
			  }
			| undefined;

		before(async () => {
			let initialUrls: string[] = [];
			if (browserName === "firefox") {
				await browser.waitUntil(
					async () => {
						initialUrls = await getWindowUrls();
						return initialUrls.some((url) =>
							/^(chrome|moz)-extension:\/\/[^/]+\/tabs\/welcome\.html$/.test(
								url,
							),
						);
					},
					{
						interval: 100,
						timeout: 10_000,
						timeoutMsg: "Fresh installation did not expose its Welcome page",
					},
				);
			} else {
				initialUrls = await getWindowUrls();
			}

			const welcomeUrl = await getExtensionPageUrl("welcome");
			await openExtensionPage("welcome");

			await browser.waitUntil(
				async () => {
					const stored = await readLocalStorage(INSTALLED_DATE_KEY);
					return typeof stored[INSTALLED_DATE_KEY] === "string";
				},
				{
					interval: 100,
					timeout: 10_000,
					timeoutMsg: "Fresh installation metadata was not written",
				},
			);

			const stored = await readLocalStorage(INSTALLED_DATE_KEY);
			pristineInstallState = {
				installedDate: stored[INSTALLED_DATE_KEY],
				welcomeUrls: initialUrls.filter((url) => url === welcomeUrl),
				welcomeUrl,
			};
		});

		beforeEach(async () => {
			await resetExtensionState({ createRootFolder: false });
		});

		it("stores dated install metadata on first install", () => {
			if (!pristineInstallState) {
				throw new Error("Pristine installation state was not captured");
			}

			expect(typeof pristineInstallState.installedDate).toBe("string");
			expect(
				Number.isNaN(Date.parse(String(pristineInstallState.installedDate))),
			).toBe(false);
		});

		it("opens exactly one Welcome page on first install when the driver exposes it", function () {
			if (!pristineInstallState) {
				throw new Error("Pristine installation state was not captured");
			}

			/* ChromiumDriver can suppress tabs created while a command-line extension
			 * is loading. Firefox installs at runtime, so its tab remains observable. */
			if (
				browserName === "chromium" &&
				pristineInstallState.welcomeUrls.length === 0
			) {
				this.skip();
			}

			expect(pristineInstallState.welcomeUrls).toHaveLength(1);
			expect(pristineInstallState.welcomeUrls[0]).toBe(
				pristineInstallState.welcomeUrl,
			);
		});

		it("navigates forward and backward and rejects a whitespace-only folder name", async () => {
			await openImportStep();
			await byAccessibleName("BACK").click();
			await expect(byAccessibleName("Hi, I'm Vivid!")).toBeDisplayed();

			await byAccessibleName("START").click();
			await byAccessibleName("Create a new bookmark folder").click();
			await expect(byAccessibleName("Create Bookmark Folder")).toBeDisplayed();

			const folderName = byAccessibleName("Bookmark folder name");
			await folderName.setValue("   ");
			await expect(byAccessibleName("FINISH")).toBeDisabled();

			await folderName.setValue("Valid folder");
			await expect(byAccessibleName("FINISH")).toBeEnabled();
			await byAccessibleName("BACK").click();
			await expect(byAccessibleName("Import Bookmarks")).toBeDisplayed();

			expect((await readSettings()).general.rootFolder).toBe("");
			expect(
				findFoldersByTitle(await readBookmarkTree(), "Valid folder"),
			).toHaveLength(0);
		});

		it("keeps FINISH disabled without a selection and resets selection after BACK", async () => {
			const sourceFolderId = await createBookmarkFolder("Selection source");
			const sourceBookmarkId = await createBookmark({
				parentId: sourceFolderId,
				title: "Selection state bookmark",
				url: "https://example.com/selection-state",
			});

			await openImportStep();
			await byAccessibleName("Import from browser bookmarks").click();
			const finish = byAccessibleName("FINISH");
			await expect(finish).toBeDisabled();

			await chooseImportFolder("Selection source");
			await expect(finish).toBeEnabled();

			await byAccessibleName("BACK").click();
			await expect(byAccessibleName("Import Bookmarks")).toBeDisplayed();
			await byAccessibleName("Import from browser bookmarks").click();
			await expect(byAccessibleName("FINISH")).toBeDisabled();
			await expect($("#browser-bookmark-folder")).toHaveText("Select folder");

			const tree = await readBookmarkTree();
			expect(findBookmarkNode(tree, sourceFolderId)?.url).toBeUndefined();
			expect(findBookmarkNode(tree, sourceBookmarkId)?.parentId).toBe(
				sourceFolderId,
			);
			expect((await readSettings()).general.rootFolder).toBe("");
		});

		it("creates one trimmed root and one New Tab after rapid duplicate submission", async () => {
			const folderTitle = "Created once";

			await openImportStep();
			await byAccessibleName("Create a new bookmark folder").click();

			const folderName = byAccessibleName("Bookmark folder name");
			await folderName.setValue(`  ${folderTitle}  `);
			await browser.execute(() => {
				const form = document.querySelector<HTMLFormElement>("form");
				if (!form) throw new Error("Create-folder form was not rendered");

				form.requestSubmit();
				form.requestSubmit();
			});

			await assertSingleReplacementTab();

			const folders = findFoldersByTitle(await readBookmarkTree(), folderTitle);
			expect(folders).toHaveLength(1);
			await waitForPersistedRoot(folders[0]?.id);
			expect((await readSettings()).general.rootFolder).toBe(folders[0]?.id);
		});

		it("imports a nested browser folder and renders its bookmark on New Tab", async () => {
			const sourceFolderId = await createBookmarkFolder("Import source");
			const nestedFolderId = await createBookmarkFolder(
				"Nested bookmarks",
				sourceFolderId,
			);
			const importedBookmarkId = await createBookmark({
				parentId: nestedFolderId,
				title: "Imported bookmark",
				url: "https://example.com/imported",
			});

			await openImportStep();
			await byAccessibleName("Import from browser bookmarks").click();
			await expect(
				byAccessibleName("Import from browser bookmarks"),
			).toBeDisplayed();

			await chooseImportFolder("Nested bookmarks");
			await byAccessibleName("FINISH").click();

			await assertSingleReplacementTab();
			await expect(byAccessibleName("Imported bookmark")).toBeDisplayed();
			expect((await readSettings()).general.rootFolder).toBe(nestedFolderId);

			const tree = await readBookmarkTree();
			expect(findBookmarkNode(tree, nestedFolderId)?.parentId).toBe(
				sourceFolderId,
			);
			expect(findBookmarkNode(tree, importedBookmarkId)?.parentId).toBe(
				nestedFolderId,
			);
		});

		it("persists the intended ID when browser folders have duplicate names", async () => {
			const firstPathId = await createBookmarkFolder("Alpha path");
			const firstDuplicateId = await createBookmarkFolder(
				"Shared import folder",
				firstPathId,
			);
			const wrongBookmarkId = await createBookmark({
				parentId: firstDuplicateId,
				title: "Wrong duplicate bookmark",
				url: "https://example.com/wrong-duplicate",
			});
			const secondPathId = await createBookmarkFolder("Beta path");
			const intendedFolderId = await createBookmarkFolder(
				"Shared import folder",
				secondPathId,
			);
			const intendedBookmarkId = await createBookmark({
				parentId: intendedFolderId,
				title: "Intended duplicate bookmark",
				url: "https://example.com/intended-duplicate",
			});

			await openImportStep();
			await byAccessibleName("Import from browser bookmarks").click();
			await chooseImportFolder("Shared import folder", 1);
			await byAccessibleName("FINISH").click();

			await assertSingleReplacementTab();
			await expect(
				byAccessibleName("Intended duplicate bookmark"),
			).toBeDisplayed();
			expect(
				await byAccessibleName("Wrong duplicate bookmark").isExisting(),
			).toBe(false);
			expect((await readSettings()).general.rootFolder).toBe(intendedFolderId);

			const tree = await readBookmarkTree();
			expect(findBookmarkNode(tree, firstDuplicateId)?.parentId).toBe(
				firstPathId,
			);
			expect(findBookmarkNode(tree, wrongBookmarkId)?.parentId).toBe(
				firstDuplicateId,
			);
			expect(findBookmarkNode(tree, intendedFolderId)?.parentId).toBe(
				secondPathId,
			);
			expect(findBookmarkNode(tree, intendedBookmarkId)?.parentId).toBe(
				intendedFolderId,
			);
		});

		it("repairs safely when the selected import folder is deleted before FINISH", async () => {
			const selectedFolderId = await createBookmarkFolder("Deleted selection");
			const deletedBookmarkId = await createBookmark({
				parentId: selectedFolderId,
				title: "Deleted selection bookmark",
				url: "https://example.com/deleted-selection",
			});

			await openImportStep();
			await byAccessibleName("Import from browser bookmarks").click();
			await chooseImportFolder("Deleted selection");
			await expect(byAccessibleName("FINISH")).toBeEnabled();

			await removeBookmarkTree(selectedFolderId);
			await browser.waitUntil(
				async () =>
					findBookmarkNode(await readBookmarkTree(), selectedFolderId) ===
					undefined,
				{
					interval: 50,
					timeout: 5_000,
					timeoutMsg: "Selected bookmark folder was not deleted",
				},
			);
			await expect(byAccessibleName("FINISH")).toBeEnabled();
			await byAccessibleName("FINISH").click();

			await assertSingleReplacementTab();
			await waitForPersistedRoot();

			const repairedSettings = await readSettings();
			const tree = await readBookmarkTree();
			const defaultFolders = findFoldersByTitle(
				tree,
				DEFAULT_ROOT_FOLDER_TITLE,
			);
			expect(defaultFolders).toHaveLength(1);
			expect(repairedSettings.general.rootFolder).toBe(defaultFolders[0]?.id);
			expect(repairedSettings.general.rootFolder).not.toBe(selectedFolderId);
			expect(findBookmarkNode(tree, selectedFolderId)).toBeUndefined();
			expect(findBookmarkNode(tree, deletedBookmarkId)).toBeUndefined();
		});

		it("creates and persists the default root folder when onboarding is skipped", async () => {
			await finishWithoutImporting();
			await waitForPersistedRoot();

			const folders = findFoldersByTitle(
				await readBookmarkTree(),
				DEFAULT_ROOT_FOLDER_TITLE,
			);
			expect(folders).toHaveLength(1);
			expect((await readSettings()).general.rootFolder).toBe(folders[0]?.id);
		});

		it("reuses an existing default root folder when onboarding is skipped", async () => {
			const existingRootFolderId = await createBookmarkFolder(
				DEFAULT_ROOT_FOLDER_TITLE,
			);

			await finishWithoutImporting();
			await waitForPersistedRoot(existingRootFolderId);

			const folders = findFoldersByTitle(
				await readBookmarkTree(),
				DEFAULT_ROOT_FOLDER_TITLE,
			);
			expect(folders).toHaveLength(1);
			expect(folders[0]?.id).toBe(existingRootFolderId);
		});

		it("repairs a persisted root folder that was deleted before onboarding completes", async () => {
			const { rootFolderId: deletedRootFolderId } = await resetExtensionState({
				rootFolderTitle: "Deleted onboarding root",
			});
			expect(deletedRootFolderId).not.toBeNull();

			await resetExtensionState({
				configureSettings: (settings) => {
					settings.general.rootFolder = deletedRootFolderId ?? "";
				},
				createRootFolder: false,
			});

			await finishWithoutImporting();
			await waitForPersistedRoot();

			const repairedSettings = await readSettings();
			const folders = findFoldersByTitle(
				await readBookmarkTree(),
				DEFAULT_ROOT_FOLDER_TITLE,
			);
			expect(folders).toHaveLength(1);
			expect(repairedSettings.general.rootFolder).toBe(folders[0]?.id);
			expect(repairedSettings.general.rootFolder).not.toBe(deletedRootFolderId);
		});
	});
};
