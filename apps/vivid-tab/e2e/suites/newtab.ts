import { $, browser, expect } from "@wdio/globals";
import {
	createBookmark,
	createBookmarkFolder,
	getExtensionPageUrl,
	getWindowUrls,
	openBrowserNewTabOverride,
	openExtensionPage,
	readBookmarkTree,
	readLocalStorage,
	readSettings,
	resetExtensionState,
	writeLocalStorage,
	writeSettings,
} from "../support/extension";

type BrowserName = "chromium" | "firefox";

type BookmarkNode = {
	children?: BookmarkNode[];
	id: string;
	parentId?: string;
	title: string;
	url?: string;
};

const byAccessibleName = (name: string) => $(`aria/${name}`);

const focusButtonByAccessibleName = (name: string) =>
	browser.execute((accessibleName) => {
		const button = Array.from(document.querySelectorAll("button")).find(
			(candidate) => candidate.getAttribute("aria-label") === accessibleName,
		);
		if (!button) throw new Error(`Button not found: ${accessibleName}`);

		button.focus();
	}, name);

const flattenBookmarkTree = (nodes: readonly BookmarkNode[]): BookmarkNode[] =>
	nodes.flatMap((node) => [node, ...flattenBookmarkTree(node.children ?? [])]);

const findBookmark = (
	nodes: readonly BookmarkNode[],
	predicate: (node: BookmarkNode) => boolean,
) => flattenBookmarkTree(nodes).find(predicate);

const decodeBrowserUrl = (url: string) => {
	try {
		return decodeURIComponent(url.replaceAll("+", " "));
	} catch {
		return url;
	}
};

const waitForNewWindowUrl = async (
	previousHandles: readonly string[],
	predicate: (url: string) => boolean,
	timeoutMsg: string,
) => {
	const previousHandleSet = new Set(previousHandles);
	let match: { handle: string; url: string } | undefined;

	await browser.waitUntil(
		async () => {
			for (const handle of await browser.getWindowHandles()) {
				if (previousHandleSet.has(handle)) continue;

				try {
					await browser.switchToWindow(handle);
					const url = await browser.getUrl();
					if (predicate(url)) {
						match = { handle, url };

						return true;
					}
				} catch {
					/* A just-created tab may be replaced while its URL is resolving. */
				}
			}

			return false;
		},
		{ interval: 50, timeout: 10_000, timeoutMsg },
	);

	if (!match) throw new Error(timeoutMsg);

	return match;
};

const closeWindowAndReturn = async (
	windowHandle: string,
	returnHandle: string,
) => {
	await browser.switchToWindow(windowHandle);
	await browser.closeWindow();
	await browser.switchToWindow(returnHandle);
};

const submitSearchQuery = async (query: string) => {
	await $("button[aria-haspopup='dialog']").click();
	const dialog = $("[role='dialog']");
	await expect(dialog).toBeDisplayed();
	await dialog.$("input[placeholder='Search the web…']").setValue(query);
	await dialog.$("button[aria-label='Search']").click();
};

const removeBookmarkTree = async (bookmarkId: string) => {
	const error = await browser.executeAsync<string | null, [string]>(
		(id, done) => {
			chrome.bookmarks.removeTree(id, () => {
				done(chrome.runtime.lastError?.message ?? null);
			});
		},
		bookmarkId,
	);

	if (error) throw new Error(error);
};

const parseStoredArray = async (key: string): Promise<unknown[]> => {
	const value = (await readLocalStorage(key))[key];
	if (typeof value !== "string") return [];

	try {
		const parsed: unknown = JSON.parse(value);

		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
};

const waitForStoredArray = async (
	key: string,
	predicate: (items: readonly unknown[]) => boolean,
) => {
	let items: unknown[] = [];

	await browser.waitUntil(
		async () => {
			items = await parseStoredArray(key);

			return predicate(items);
		},
		{
			interval: 50,
			timeout: 5_000,
			timeoutMsg: `Extension storage key "${key}" did not reach the expected state`,
		},
	);

	return items;
};

const waitForBookmark = async (
	predicate: (node: BookmarkNode) => boolean,
	timeoutMsg: string,
) => {
	let bookmark: BookmarkNode | undefined;

	await browser.waitUntil(
		async () => {
			bookmark = findBookmark(await readBookmarkTree(), predicate);

			return bookmark !== undefined;
		},
		{ interval: 50, timeout: 5_000, timeoutMsg },
	);

	return bookmark;
};

const openBookmarkAction = async (
	bookmarkTitle: string,
	action: "Delete" | "Edit" | "Move",
) => {
	const bookmark = await byAccessibleName(bookmarkTitle);
	await expect(bookmark).toBeDisplayed();
	await bookmark.click({ button: "right" });

	const menuAction = byAccessibleName(action);
	const openedFromPointer = await menuAction
		.waitForDisplayed({ timeout: 1_000 })
		.then(
			() => true,
			() => false,
		);

	/* Firefox occasionally drops WebDriver's secondary-button release when a
	 * draggable owns the same pointer. Dispatch the browser event that Radix
	 * consumes so the journey still exercises the real rendered menu. */
	if (!openedFromPointer) {
		await browser.execute((target) => {
			const element = target as unknown as HTMLElement;
			const bounds = element.getBoundingClientRect();
			element.dispatchEvent(
				new MouseEvent("contextmenu", {
					bubbles: true,
					button: 2,
					buttons: 2,
					cancelable: true,
					clientX: bounds.left + bounds.width / 2,
					clientY: bounds.top + bounds.height / 2,
				}),
			);
		}, bookmark);
	}

	await expect(menuAction).toBeDisplayed();
	await menuAction.click();
};

/** Runs the real New Tab journeys against both packaged browser targets. */
export const runNewtabSuite = (browserName: BrowserName) => {
	describe(`New Tab journeys (${browserName})`, () => {
		let rootFolderId: string;

		beforeEach(async () => {
			const reset = await resetExtensionState({
				configureSettings: (settings) => {
					settings.appearance.background.randomizeWallpaper = "off";
					settings.appearance.wallpapers.onlineImages.enabled = false;
				},
			});

			if (!reset.rootFolderId) {
				throw new Error("New Tab tests require a real bookmark root folder");
			}

			rootFolderId = reset.rootFolderId;
		});

		it("replaces the browser's built-in new-tab page", async () => {
			await openBrowserNewTabOverride();

			await expect(browser).toHaveUrl(await getExtensionPageUrl("newtab"));
			await expect(byAccessibleName("Open settings")).toBeDisplayed();
		});

		it("applies persisted theme, radius, and visual-effect attributes", async () => {
			const settings = await readSettings();
			settings.appearance.radius = "none";
			settings.appearance.theme = "tokyo-night";
			settings.appearance.visualEffect = "opaque";
			await writeSettings(settings);

			await openExtensionPage("newtab");

			await expect($("html")).toHaveAttribute("data-theme", "tokyo-night");
			await expect($("body")).toHaveAttribute("data-radius", "none");
			await expect($("body")).toHaveAttribute("data-visual-effect", "opaque");

			const persisted = await readSettings();
			expect(persisted.appearance).toMatchObject({
				radius: "none",
				theme: "tokyo-night",
				visualEffect: "opaque",
			});
		});

		for (const rootState of ["missing", "deleted"] as const) {
			it(`repairs a ${rootState} bookmark root when New Tab opens`, async () => {
				await removeBookmarkTree(rootFolderId);

				if (rootState === "missing") {
					const settings = await readSettings();
					settings.general.rootFolder = "";
					await writeSettings(settings);
				}

				await openExtensionPage("newtab");
				await expect(byAccessibleName("Open settings")).toBeDisplayed();
				let repairedRootId = "";
				await browser.waitUntil(
					async () => {
						repairedRootId = (await readSettings()).general.rootFolder;

						return Boolean(repairedRootId && repairedRootId !== rootFolderId);
					},
					{
						interval: 50,
						timeout: 5_000,
						timeoutMsg: `The ${rootState} bookmark root was not repaired`,
					},
				);

				const repairedFolders = flattenBookmarkTree(
					await readBookmarkTree(),
				).filter(
					(node) => node.url === undefined && node.title === "Vivid Tab",
				);
				expect(repairedFolders).toHaveLength(1);
				expect(repairedFolders[0]?.id).toBe(repairedRootId);

				const repairedBookmarkTitle = `Visible after ${rootState} root repair`;
				await createBookmark({
					parentId: repairedRootId,
					title: repairedBookmarkTitle,
					url: `https://example.com/${rootState}-root-repair`,
				});
				await expect(byAccessibleName(repairedBookmarkTitle)).toBeDisplayed();
			});
		}

		it("opens search by pointer and hotkey, ignores blanks, and resets its draft", async () => {
			await openExtensionPage("newtab");

			const searchTrigger = $("button[aria-haspopup='dialog']");
			await searchTrigger.click();

			let dialog = $("[role='dialog']");
			await expect(dialog).toBeDisplayed();

			let searchInput = dialog.$("input[placeholder='Search the web…']");
			await expect(searchInput).toBeFocused();
			await searchInput.setValue("   ");

			const submit = dialog.$("button[aria-label='Search']");
			await expect(submit).toBeDisabled();
			await browser.keys("Enter");
			await expect(dialog).toBeDisplayed();

			await browser.keys("Escape");
			await expect(dialog).not.toBeDisplayed();

			await browser.keys([
				process.platform === "darwin" ? "Meta" : "Control",
				",",
			]);
			dialog = $("[role='dialog']");
			await expect(dialog).toBeDisplayed();
			searchInput = dialog.$("input[placeholder='Search the web…']");
			expect(await searchInput.getValue()).toBe("");
		});

		it("opens a direct URL in a new tab instead of sending it to search", async () => {
			const settings = await readSettings();
			settings.general.openUrlIn = "new-tab";
			await writeSettings(settings);

			await openExtensionPage("newtab");
			const expectedUrl = "https://example.com/vivid-tab-e2e";

			await $("button[aria-haspopup='dialog']").click();
			const dialog = $("[role='dialog']");
			await dialog
				.$("input[placeholder='Search the web…']")
				.setValue("example.com/vivid-tab-e2e");
			await dialog.$("button[aria-label='Search']").click();

			await browser.waitUntil(
				async () => {
					const urls = await getWindowUrls();

					return urls.some((url) => url.startsWith(expectedUrl));
				},
				{
					interval: 50,
					timeout: 5_000,
					timeoutMsg: "The direct URL was not opened in a new browser tab",
				},
			);
		});

		it("routes plain text and unsafe URL-like input through browser search", async () => {
			const settings = await readSettings();
			settings.general.openUrlIn = "new-tab";
			await writeSettings(settings);
			await openExtensionPage("newtab");

			const extensionHandle = await browser.getWindowHandle();
			let previousHandles = await browser.getWindowHandles();
			const plainTextQuery = "vivid tab plain text route e2e";
			await submitSearchQuery(plainTextQuery);

			const plainTextSearch = await waitForNewWindowUrl(
				previousHandles,
				(url) =>
					decodeBrowserUrl(url)
						.toLowerCase()
						.includes(plainTextQuery.toLowerCase()),
				"Plain text was not routed to the browser search provider",
			);
			expect(plainTextSearch.url).not.toMatch(/^(?:chrome|moz)-extension:\/\//);
			await closeWindowAndReturn(plainTextSearch.handle, extensionHandle);

			previousHandles = await browser.getWindowHandles();
			const unsafeToken = "vivid-unsafe-route-e2e";
			await submitSearchQuery(`javascript:alert('${unsafeToken}')`);

			const unsafeSearch = await waitForNewWindowUrl(
				previousHandles,
				(url) => decodeBrowserUrl(url).includes(unsafeToken),
				"Unsafe URL-like input was not routed to browser search",
			);
			expect(unsafeSearch.url.startsWith("javascript:")).toBe(false);
			await closeWindowAndReturn(unsafeSearch.handle, extensionHandle);
		});

		it("opens a fully qualified URL in the current tab", async () => {
			const settings = await readSettings();
			settings.general.openUrlIn = "current-tab";
			await writeSettings(settings);
			await openExtensionPage("newtab");

			const previousHandles = await browser.getWindowHandles();
			const currentHandle = await browser.getWindowHandle();
			const expectedUrl = "https://example.com/vivid-tab-qualified?source=e2e";
			await submitSearchQuery(`  ${expectedUrl}  `);

			await browser.waitUntil(
				async () => (await browser.getUrl()).startsWith(expectedUrl),
				{
					interval: 50,
					timeout: 10_000,
					timeoutMsg: "The fully qualified URL did not replace the current tab",
				},
			);
			expect(await browser.getWindowHandle()).toBe(currentHandle);
			expect(await browser.getWindowHandles()).toHaveLength(
				previousHandles.length,
			);
		});

		it("rejects whitespace notes, then persists, reloads, and deletes a note", async () => {
			await openExtensionPage("newtab");

			const noteText = "Remember the release checklist";
			const noteDraft = $("textarea[placeholder='Add a note...']");
			await noteDraft.setValue("  \n  ");
			await expect(byAccessibleName("Add Note")).toBeDisabled();

			await noteDraft.setValue(noteText);
			await byAccessibleName("Add Note").click();
			expect(await noteDraft.getValue()).toBe("");

			const storedNotes = await waitForStoredArray(
				"notes",
				(items) => items.length === 1,
			);
			expect(storedNotes[0]).toMatchObject({ text: noteText });

			await browser.refresh();
			const renderedNote = $(`p=${noteText}`);
			await expect(renderedNote).toBeDisplayed();
			const deleteNote = byAccessibleName("Delete note");
			await focusButtonByAccessibleName("Delete note");
			await expect(deleteNote).toBeFocused();
			await browser.keys("Enter");

			await expect(renderedNote).not.toBeDisplayed();
			await waitForStoredArray("notes", (items) => items.length === 0);
		});

		it("rejects whitespace todos, then persists, reloads, toggles, and deletes a todo", async () => {
			await openExtensionPage("newtab");

			const todoText = "Verify the packaged extension";
			const todoDraft = $("input[placeholder='Add new todo']");
			const todoForm = todoDraft.parentElement();
			const addTodo = todoForm.$("button[type='submit']");

			await todoDraft.setValue("   ");
			await expect(addTodo).toBeDisabled();
			await todoDraft.setValue(`  ${todoText}  `);
			await browser.keys("Enter");

			const storedTodos = await waitForStoredArray(
				"todos",
				(items) => items.length === 1,
			);
			expect(storedTodos[0]).toMatchObject({
				completed: false,
				completedAt: null,
				text: todoText,
			});
			const todoId = (storedTodos[0] as { id: number }).id;

			await browser.refresh();
			const checkbox = $(`#todo-${todoId}`);
			await expect(checkbox).toBeDisplayed();
			await expect($(`label[for="todo-${todoId}"]`)).toHaveText(todoText);
			await checkbox.click();

			const completedTodos = await waitForStoredArray(
				"todos",
				(items) =>
					items.length === 1 &&
					typeof items[0] === "object" &&
					items[0] !== null &&
					"completed" in items[0] &&
					items[0].completed === true,
			);
			expect(completedTodos[0]).toMatchObject({
				completed: true,
				text: todoText,
			});

			const deleteTodo = byAccessibleName(`Delete ${todoText}`);
			await focusButtonByAccessibleName(`Delete ${todoText}`);
			await expect(deleteTodo).toBeFocused();
			await browser.keys("Enter");
			await expect(checkbox).not.toBeDisplayed();
			await waitForStoredArray("todos", (items) => items.length === 0);
		});

		it("removes completed todos that already passed their expiration", async () => {
			const settings = await readSettings();
			settings.widgets.todos.expireAfterCompleted.enabled = true;
			settings.widgets.todos.expireAfterCompleted.durationInMinutes = 1;
			await writeSettings(settings);

			const expiredAt = Date.now() - 120_000;
			await writeLocalStorage({
				todos: JSON.stringify([
					{
						completed: true,
						completedAt: expiredAt,
						id: expiredAt,
						text: "Expired todo",
					},
				]),
			});

			await openExtensionPage("newtab");
			await expect(byAccessibleName("Expired todo")).not.toBeDisplayed();
			await waitForStoredArray("todos", (items) => items.length === 0);
		});

		it("synchronizes notes and todos between two live New Tab pages", async () => {
			await openExtensionPage("newtab");
			const firstHandle = await browser.getWindowHandle();
			const secondWindow = await browser.newWindow(
				await getExtensionPageUrl("newtab"),
				{ type: "tab" },
			);

			try {
				await openExtensionPage("newtab");
				await expect(byAccessibleName("Open settings")).toBeDisplayed();

				const noteText = "Shared across open tabs";
				const todoText = "Observe live storage changes";
				await $("textarea[placeholder='Add a note...']").setValue(noteText);
				await byAccessibleName("Add Note").click();
				await $("input[placeholder='Add new todo']").setValue(todoText);
				await browser.keys("Enter");

				const storedTodos = await waitForStoredArray(
					"todos",
					(items) => items.length === 1,
				);
				const todoId = (storedTodos[0] as { id: number }).id;
				await waitForStoredArray("notes", (items) => items.length === 1);

				await browser.switchToWindow(firstHandle);
				await expect($(`p=${noteText}`)).toBeDisplayed();
				const firstTodo = $(`#todo-${todoId}`);
				await expect(firstTodo).toBeDisplayed();
				await expect($(`label[for="todo-${todoId}"]`)).toHaveText(todoText);
				await firstTodo.click();

				await waitForStoredArray(
					"todos",
					(items) =>
						items.length === 1 &&
						typeof items[0] === "object" &&
						items[0] !== null &&
						"completed" in items[0] &&
						items[0].completed === true,
				);

				await browser.switchToWindow(secondWindow.handle);
				await expect($(`#todo-${todoId}`)).toHaveAttribute(
					"data-state",
					"checked",
				);
				await focusButtonByAccessibleName("Delete note");
				await browser.keys("Enter");
				await waitForStoredArray("notes", (items) => items.length === 0);

				await browser.switchToWindow(firstHandle);
				await expect($(`p=${noteText}`)).not.toBeDisplayed();
				await focusButtonByAccessibleName(`Delete ${todoText}`);
				await browser.keys("Enter");
				await waitForStoredArray("todos", (items) => items.length === 0);

				await browser.switchToWindow(secondWindow.handle);
				await expect($(`#todo-${todoId}`)).not.toBeDisplayed();
			} finally {
				await browser.switchToWindow(firstHandle);
			}
		});

		it("navigates into and back out of a nested real bookmark folder", async () => {
			const projectFolderId = await createBookmarkFolder(
				"Projects",
				rootFolderId,
			);
			const nestedFolderId = await createBookmarkFolder(
				"Frontend",
				projectFolderId,
			);
			await createBookmark({
				parentId: nestedFolderId,
				title: "Nested reference",
				url: "https://example.com/nested-reference",
			});

			await openExtensionPage("newtab");
			await byAccessibleName("Projects").click();

			const nestedFolder = byAccessibleName("Frontend");
			await expect(nestedFolder).toBeDisplayed();
			await nestedFolder.click();
			await expect(byAccessibleName("Nested reference")).toBeDisplayed();

			await byAccessibleName("Back").click();
			await expect(byAccessibleName("Frontend")).toBeDisplayed();
		});

		it("opens bookmarks in the configured current or new tab", async () => {
			const currentTabTitle = "Open in current tab";
			const currentTabUrl = "https://example.com/bookmark-current-tab";
			const newTabTitle = "Open in new tab";
			const newTabUrl = "https://example.com/bookmark-new-tab";
			await createBookmark({
				parentId: rootFolderId,
				title: currentTabTitle,
				url: currentTabUrl,
			});
			await createBookmark({
				parentId: rootFolderId,
				title: newTabTitle,
				url: newTabUrl,
			});

			let settings = await readSettings();
			settings.general.openUrlIn = "new-tab";
			await writeSettings(settings);
			await openExtensionPage("newtab");

			const extensionHandle = await browser.getWindowHandle();
			const previousHandles = await browser.getWindowHandles();
			await byAccessibleName(newTabTitle).click();
			const openedTab = await waitForNewWindowUrl(
				previousHandles,
				(url) => url.startsWith(newTabUrl),
				"The bookmark did not open in a new browser tab",
			);
			await closeWindowAndReturn(openedTab.handle, extensionHandle);
			await expect(browser).toHaveUrl(await getExtensionPageUrl("newtab"));

			settings = await readSettings();
			settings.general.openUrlIn = "current-tab";
			await writeSettings(settings);
			await browser.refresh();
			await expect(byAccessibleName(currentTabTitle)).toBeDisplayed();
			const handlesBeforeCurrentNavigation = await browser.getWindowHandles();
			await byAccessibleName(currentTabTitle).click();

			await browser.waitUntil(
				async () => (await browser.getUrl()).startsWith(currentTabUrl),
				{
					interval: 50,
					timeout: 10_000,
					timeoutMsg: "The bookmark did not replace the current browser tab",
				},
			);
			expect(await browser.getWindowHandle()).toBe(extensionHandle);
			expect(await browser.getWindowHandles()).toHaveLength(
				handlesBeforeCurrentNavigation.length,
			);
		});

		it("creates, edits, moves, and deletes a real browser bookmark", async () => {
			const destinationTitle = "Archive";
			const sourceTitle = "Projects";
			const destinationId = await createBookmarkFolder(
				destinationTitle,
				rootFolderId,
			);
			const sourceId = await createBookmarkFolder(sourceTitle, rootFolderId);

			await openExtensionPage("newtab");
			await byAccessibleName(sourceTitle).click();
			await byAccessibleName("Create bookmark").click();

			let dialog = $("[role='dialog']");
			await expect(dialog).toBeDisplayed();
			const createdTitle = "Created link";
			const createdUrl = "https://example.com/created-link";
			await dialog.$("aria/Name").setValue(`  ${createdTitle}  `);
			await dialog.$("aria/Address").setValue(`  ${createdUrl}  `);
			await dialog.$("aria/Save").click();
			await expect(byAccessibleName(createdTitle)).toBeDisplayed();

			const created = await waitForBookmark(
				(node) => node.title === createdTitle && node.url === createdUrl,
				"The bookmark created through the UI was not persisted",
			);
			expect(created?.parentId).toBe(sourceId);

			await openBookmarkAction(createdTitle, "Edit");
			dialog = $("[role='dialog']");
			await expect(dialog).toBeDisplayed();
			const editedTitle = "Edited link";
			const editedUrl = "https://example.com/edited-link";
			await dialog.$("aria/Name").setValue(editedTitle);
			await dialog.$("aria/Address").setValue(editedUrl);
			await dialog.$("aria/Save").click();
			await expect(byAccessibleName(editedTitle)).toBeDisplayed();

			const edited = await waitForBookmark(
				(node) =>
					node.id === created?.id &&
					node.title === editedTitle &&
					node.url === editedUrl,
				"The edited bookmark state was not persisted",
			);
			expect(edited?.parentId).toBe(sourceId);

			await openBookmarkAction(editedTitle, "Move");
			dialog = $("[role='dialog']");
			await expect(dialog).toBeDisplayed();
			await dialog.$("#move-bookmark-folder").click();
			const listbox = $("[role='listbox']");
			await expect(listbox).toBeDisplayed();
			await listbox
				.$(`.//div[@role="option" and contains(., "${destinationTitle}")]`)
				.click();
			await dialog.$("button=Move").click();
			await dialog.waitForExist({ reverse: true });

			const moved = await waitForBookmark(
				(node) => node.id === created?.id && node.parentId === destinationId,
				"The bookmark was not moved to the selected browser folder",
			);
			expect(moved?.title).toBe(editedTitle);

			await byAccessibleName(destinationTitle).click();
			await expect(byAccessibleName(editedTitle)).toBeDisplayed();
			await openBookmarkAction(editedTitle, "Delete");
			const alertDialog = $("[role='alertdialog']");
			await expect(alertDialog).toBeDisplayed();
			await alertDialog.$("aria/Delete").click();

			await browser.waitUntil(
				async () =>
					findBookmark(
						await readBookmarkTree(),
						(node) => node.id === created?.id,
					) === undefined,
				{
					interval: 50,
					timeout: 5_000,
					timeoutMsg: "The deleted bookmark remained in the browser tree",
				},
			);
			await expect(byAccessibleName(editedTitle)).not.toBeDisplayed();
		});

		it("creates, edits, moves, and recursively deletes a bookmark folder", async () => {
			await createBookmark({
				parentId: rootFolderId,
				title: "Home marker",
				url: "https://example.com/home-marker",
			});
			const destinationTitle = "Folder destination";
			const destinationId = await createBookmarkFolder(
				destinationTitle,
				rootFolderId,
			);

			await openExtensionPage("newtab");
			await byAccessibleName("Home").click();
			await byAccessibleName("Create bookmark folder").click();

			let dialog = $("[role='dialog']");
			await expect(dialog).toBeDisplayed();
			const createdTitle = "Created folder";
			await dialog.$("aria/Name").setValue(`  ${createdTitle}  `);
			await dialog.$("aria/Save").click();
			await expect(byAccessibleName(createdTitle)).toBeDisplayed();

			const created = await waitForBookmark(
				(node) =>
					node.title === createdTitle &&
					node.url === undefined &&
					node.parentId === rootFolderId,
				"The folder created through the UI was not persisted",
			);
			if (!created) throw new Error("The created folder could not be resolved");

			const childFolderTitle = "Child folder";
			const childFolderId = await createBookmarkFolder(
				childFolderTitle,
				created.id,
			);
			const childBookmarkId = await createBookmark({
				parentId: childFolderId,
				title: "Nested folder bookmark",
				url: "https://example.com/nested-folder-bookmark",
			});

			await openBookmarkAction(createdTitle, "Edit");
			dialog = $("[role='dialog']");
			await expect(dialog).toBeDisplayed();
			const editedTitle = "Edited folder";
			await dialog.$("aria/Name").setValue(editedTitle);
			await dialog.$("aria/Save").click();
			await expect(byAccessibleName(editedTitle)).toBeDisplayed();

			await waitForBookmark(
				(node) => node.id === created.id && node.title === editedTitle,
				"The edited folder title was not persisted",
			);
			await openBookmarkAction(editedTitle, "Move");
			dialog = $("[role='dialog']");
			await expect(dialog).toBeDisplayed();
			await dialog.$("#move-bookmark-folder").click();
			const listbox = $("[role='listbox']");
			await expect(listbox).toBeDisplayed();
			const options = await listbox.$$("[role='option']");
			const optionLabels = await options.map((option) => option.getText());
			expect(optionLabels.some((label) => label.includes(editedTitle))).toBe(
				false,
			);
			expect(
				optionLabels.some((label) => label.includes(childFolderTitle)),
			).toBe(false);
			await listbox
				.$(`.//div[@role="option" and contains(., "${destinationTitle}")]`)
				.click();
			await dialog.$("button=Move").click();
			await dialog.waitForExist({ reverse: true });

			await waitForBookmark(
				(node) => node.id === created.id && node.parentId === destinationId,
				"The folder was not moved to the selected browser folder",
			);
			await byAccessibleName(destinationTitle).click();
			const movedFolder = $(`button*=${editedTitle}`);
			await expect(movedFolder).toBeDisplayed();
			await movedFolder.click({ button: "right" });
			await byAccessibleName("Delete").click();

			const alertDialog = $("[role='alertdialog']");
			await expect(alertDialog).toBeDisplayed();
			await alertDialog.$("aria/Delete").click();
			await browser.waitUntil(
				async () => {
					const tree = await readBookmarkTree();

					return [created.id, childFolderId, childBookmarkId].every(
						(id) => findBookmark(tree, (node) => node.id === id) === undefined,
					);
				},
				{
					interval: 50,
					timeout: 5_000,
					timeoutMsg: "The deleted folder or one of its children remained",
				},
			);
			await expect(movedFolder).not.toBeDisplayed();
		});
	});
};
