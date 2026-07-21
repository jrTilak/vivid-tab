import { isDeepStrictEqual } from "node:util";
import { browser } from "@wdio/globals";
import { DEFAULT_SETTINGS } from "../../src/constants/settings";
import type { Settings } from "../../src/zod/settings";
import { FIREFOX_EXTENSION_BASE_URL } from "./paths";

export type E2ESettings = Settings;

export interface BookmarkNode {
	children?: BookmarkNode[];
	id: string;
	parentId?: string;
	title: string;
	url?: string;
}

export type ExtensionPage = "newtab" | "welcome";

interface ResetExtensionStateOptions {
	configureSettings?: (settings: E2ESettings) => void;
	createRootFolder?: boolean;
	rootFolderTitle?: string;
}

interface ResetExtensionStateResult {
	rootFolderId: string | null;
	settings: E2ESettings;
}

interface ScriptFailure {
	error: string;
	ok: false;
}

interface ScriptSuccess<Value> {
	ok: true;
	value: Value;
}

type ScriptResult<Value> = ScriptFailure | ScriptSuccess<Value>;

const PAGE_PATHS: Record<ExtensionPage, string> = {
	newtab: "newtab.html",
	welcome: "tabs/welcome.html",
};

let extensionBaseUrl: string | undefined;
const desktopNewtabHandles = new Set<string>();
const polyfilledWindowHandles = new Set<string>();

/**
 * Mounts desktop-only widgets in visible E2E runs even when a tiling compositor
 * constrains the browser below Tailwind's xl breakpoint. CSS remains responsive;
 * only the React mount guard is made deterministic for interaction coverage.
 */
const ensureDesktopNewtabLayout = async (): Promise<void> => {
	const windowHandle = await browser.getWindowHandle();
	if (desktopNewtabHandles.has(windowHandle)) return;

	await browser.addInitScript(() => {
		const matchMedia = window.matchMedia.bind(window);
		window.matchMedia = (query) => {
			const mediaQuery = matchMedia(query);
			if (query !== "(min-width: 80rem)") return mediaQuery;

			return new Proxy(mediaQuery, {
				get(target, property) {
					if (property === "matches") return true;

					const value = Reflect.get(target, property, target);
					return typeof value === "function" ? value.bind(target) : value;
				},
			});
		};
	});
	desktopNewtabHandles.add(windowHandle);
};

/**
 * Supplies the function-name helper emitted by the TypeScript E2E transform.
 * WebDriver BiDi serializes async browser callbacks without WebdriverIO's
 * classic-script helper, so Firefox needs it in every extension context.
 */
const ensureWebdriverScriptPolyfill = async (): Promise<void> => {
	const windowHandle = await browser.getWindowHandle();

	if (!polyfilledWindowHandles.has(windowHandle)) {
		await browser.addInitScript(() => {
			const scope = globalThis as typeof globalThis & {
				__name?: (...values: unknown[]) => unknown;
			};
			scope.__name ??= Function("return arguments[0]") as (
				...values: unknown[]
			) => unknown;
		});
		polyfilledWindowHandles.add(windowHandle);
	}

	/* A preload script applies on the next navigation; install it immediately
	 * as well because a freshly discovered extension page is already loaded. */
	await browser.execute(
		"globalThis.__name = globalThis.__name || function (target) { return target; }; return true;",
	);
};

const unwrapScriptResult = <Value>(result: ScriptResult<Value>): Value => {
	if ("error" in result) {
		throw new Error(`Extension test script failed: ${result.error}`);
	}

	return result.value;
};

const getBaseUrlFromPage = async (): Promise<string | undefined> => {
	try {
		const url = await browser.getUrl();
		const match = /^(chrome-extension|moz-extension):\/\/([^/]+)/.exec(url);
		if (match) return `${match[1]}://${match[2]}`;

		const runtimeUrl = await browser.execute(() => {
			if (typeof chrome === "undefined" || !chrome.runtime?.getURL) return null;

			return chrome.runtime.getURL("");
		});
		const runtimeMatch =
			typeof runtimeUrl === "string"
				? /^(chrome-extension|moz-extension):\/\/([^/]+)/.exec(runtimeUrl)
				: null;

		return runtimeMatch ? `${runtimeMatch[1]}://${runtimeMatch[2]}` : undefined;
	} catch {
		return undefined;
	}
};

const findExtensionBaseUrl = async (): Promise<string | undefined> => {
	const handles = await browser.getWindowHandles();

	for (const handle of handles) {
		try {
			await browser.switchToWindow(handle);
			const baseUrl = await getBaseUrlFromPage();
			if (baseUrl) return baseUrl;
		} catch {
			/* A welcome tab can close while its replacement tab is being discovered. */
		}
	}

	return undefined;
};

/** Discovers the random profile-local extension origin from a real loaded page. */
const getExtensionBaseUrl = async (): Promise<string> => {
	if (extensionBaseUrl) return extensionBaseUrl;
	if (browser.capabilities.browserName === "firefox") {
		extensionBaseUrl = FIREFOX_EXTENSION_BASE_URL;
		return extensionBaseUrl;
	}

	extensionBaseUrl = await findExtensionBaseUrl();

	/* ChromeDriver can suppress tabs opened while a command-line extension is
	 * loading. Its new-tab URL still exposes the installed extension origin. */
	if (!extensionBaseUrl) {
		await browser.url("chrome://newtab/");
	}

	await browser.waitUntil(
		async () => {
			extensionBaseUrl = await findExtensionBaseUrl();

			return extensionBaseUrl !== undefined;
		},
		{
			interval: 100,
			timeout: 15_000,
			timeoutMsg: "No Vivid Tab extension page opened after installation",
		},
	);

	if (!extensionBaseUrl) {
		throw new Error("Unable to discover the Vivid Tab extension origin");
	}

	return extensionBaseUrl;
};

export const getExtensionPageUrl = async (
	page: ExtensionPage,
): Promise<string> => `${await getExtensionBaseUrl()}/${PAGE_PATHS[page]}`;

/** Opens one of the extension's real HTML entry points in the current tab. */
export const openExtensionPage = async (page: ExtensionPage): Promise<void> => {
	const pageUrl = await getExtensionPageUrl(page);
	if (page === "newtab") await ensureDesktopNewtabLayout();
	await browser.url(pageUrl);
	await ensureWebdriverScriptPolyfill();
	await browser.waitUntil(
		async () =>
			(await browser.execute(() => document.readyState)) === "complete",
		{
			interval: 50,
			timeout: 10_000,
			timeoutMsg: `${page} did not finish loading`,
		},
	);
	await ensureWebdriverScriptPolyfill();
};

/**
 * Waits for onboarding to replace its own tab and switches WebDriver to the
 * requested extension page. This handles the old window closing mid-poll.
 */
export const waitForExtensionPage = async (
	page: ExtensionPage,
): Promise<void> => {
	const expectedUrl = await getExtensionPageUrl(page);

	await browser.waitUntil(
		async () => {
			for (const handle of await browser.getWindowHandles()) {
				try {
					await browser.switchToWindow(handle);
					if ((await browser.getUrl()) === expectedUrl) return true;
				} catch {
					/* Ignore handles closed by completeWelcome and inspect the next one. */
				}
			}

			return false;
		},
		{
			interval: 100,
			timeout: 15_000,
			timeoutMsg: `${page} did not open in an extension tab`,
		},
	);
	await ensureWebdriverScriptPolyfill();
};

/** Opens the browser-owned new-tab URL to verify the manifest override itself. */
export const openBrowserNewTabOverride = async (): Promise<void> => {
	const isFirefox = browser.capabilities.browserName === "firefox";
	await ensureDesktopNewtabLayout();

	/* Marionette cannot dispatch Firefox chrome-level Ctrl+T shortcuts. Read the
	 * manifest from the installed add-on itself, then load its registered page. */
	if (isFirefox) {
		const overridePath = await browser.execute(() => {
			type ManifestWithOverrides = chrome.runtime.Manifest & {
				chrome_url_overrides?: { newtab?: unknown };
			};
			const manifest = chrome.runtime.getManifest() as ManifestWithOverrides;

			return manifest.chrome_url_overrides?.newtab;
		});
		const expectedUrl = await getExtensionPageUrl("newtab");
		if (overridePath !== PAGE_PATHS.newtab && overridePath !== expectedUrl) {
			throw new Error(
				`Firefox package registered ${String(overridePath)} as its new-tab page`,
			);
		}

		await browser.url(expectedUrl);
	} else {
		await browser.url("chrome://newtab/");
	}

	await browser.waitUntil(
		async () => {
			const baseUrl = await getBaseUrlFromPage();
			if (baseUrl) extensionBaseUrl = baseUrl;

			return baseUrl === extensionBaseUrl;
		},
		{
			interval: 100,
			timeout: 10_000,
			timeoutMsg: "The browser new-tab URL did not load Vivid Tab",
		},
	);
	await ensureWebdriverScriptPolyfill();
};

export const getWindowUrls = async (): Promise<string[]> => {
	const urls: string[] = [];
	const handles = await browser.getWindowHandles();
	const originalHandle = await browser.getWindowHandle();

	for (const handle of handles) {
		try {
			await browser.switchToWindow(handle);
			urls.push(await browser.getUrl());
		} catch {
			/* A concurrently closing tab is not part of the final URL set. */
		}
	}

	if ((await browser.getWindowHandles()).includes(originalHandle)) {
		await browser.switchToWindow(originalHandle);
	}

	return urls;
};

/** Keeps each journey isolated from tabs opened by the preceding test. */
const closeExtraWindows = async (): Promise<void> => {
	const handles = await browser.getWindowHandles();
	if (handles.length <= 1) return;

	let retainedHandle: string;
	try {
		retainedHandle = await browser.getWindowHandle();
	} catch {
		retainedHandle = handles[0] as string;
	}

	for (const handle of handles) {
		if (handle === retainedHandle) continue;

		try {
			await browser.switchToWindow(handle);
			await browser.closeWindow();
		} catch {
			/* A page may close itself while the handle list is being cleaned. */
		}
	}

	await browser.switchToWindow(retainedHandle);
};

const createDeterministicSettings = (): E2ESettings => {
	const settings = structuredClone(DEFAULT_SETTINGS) as unknown as E2ESettings;
	settings.appearance.background.randomizeWallpaper = "off";
	settings.appearance.wallpapers.onlineImages.enabled = false;
	settings.widgets.layout = {
		0: "searchbar",
		3: "todos",
		4: "bookmarks",
		6: "notes",
	};

	return settings;
};

/**
 * Clears the real extension profile and writes one canonical settings object.
 * The reset runs from Welcome so New Tab's root-folder repair cannot race the
 * bookmark cleanup. Every spec can therefore start from a reproducible state.
 */
export const resetExtensionState = async ({
	configureSettings,
	createRootFolder = true,
	rootFolderTitle = "Vivid Tab",
}: ResetExtensionStateOptions = {}): Promise<ResetExtensionStateResult> => {
	await closeExtraWindows();
	await openExtensionPage("welcome");

	const settings = createDeterministicSettings();
	configureSettings?.(settings);

	const result = await browser.executeAsync<
		ScriptResult<ResetExtensionStateResult>,
		[string, boolean, string]
	>(
		(serializedSettings, shouldCreateRoot, folderTitle, done) => {
			const fail = (error: unknown) =>
				done({
					error: error instanceof Error ? error.message : String(error),
					ok: false,
				});
			const callChrome = <Value>(
				start: (callback: (value: Value) => void) => void,
			) =>
				new Promise<Value>((resolve, reject) => {
					start((value) => {
						const error = chrome.runtime.lastError;
						error ? reject(new Error(error.message)) : resolve(value);
					});
				});
			const callChromeVoid = (start: (callback: () => void) => void) =>
				callChrome<void>((callback) => start(() => callback()));
			const deleteImageDatabase = () =>
				new Promise<void>((resolve, reject) => {
					const request = indexedDB.deleteDatabase("ImageDB");
					request.onerror = () =>
						reject(request.error ?? new Error("Unable to clear ImageDB"));
					request.onblocked = () => resolve();
					request.onsuccess = () => resolve();
				});

			void (async () => {
				await callChromeVoid((callback) => chrome.storage.sync.clear(callback));
				await callChromeVoid((callback) =>
					chrome.storage.local.clear(callback),
				);

				const tree = await callChrome<chrome.bookmarks.BookmarkTreeNode[]>(
					(callback) => chrome.bookmarks.getTree(callback),
				);
				const browserRoots = tree[0]?.children ?? [];

				for (const browserRoot of browserRoots) {
					for (const node of browserRoot.children ?? []) {
						if (
							node.url !== undefined ||
							("type" in node && node.type === "separator")
						) {
							await callChromeVoid((callback) =>
								chrome.bookmarks.remove(node.id, callback),
							);
						} else {
							await callChromeVoid((callback) =>
								chrome.bookmarks.removeTree(node.id, callback),
							);
						}
					}
				}

				await deleteImageDatabase();

				const nextSettings = JSON.parse(serializedSettings) as E2ESettings;
				let rootFolderId: string | null = null;

				if (shouldCreateRoot) {
					const folder = await callChrome<chrome.bookmarks.BookmarkTreeNode>(
						(callback) =>
							chrome.bookmarks.create({ title: folderTitle }, callback),
					);
					rootFolderId = folder.id;
					nextSettings.general.rootFolder = folder.id;
				}

				await callChromeVoid((callback) =>
					chrome.storage.sync.set(
						{ settings: JSON.stringify(nextSettings) },
						callback,
					),
				);

				done({
					ok: true,
					value: { rootFolderId, settings: nextSettings },
				});
			})().catch(fail);
		},
		JSON.stringify(settings),
		createRootFolder,
		rootFolderTitle,
	);
	const resetState = unwrapScriptResult(result);

	/* Unmount the provider that observed the clear/set pair before it can flush
	 * a stale debounced snapshot from the state that existed before the reset. */
	await browser.refresh();
	await ensureWebdriverScriptPolyfill();

	await browser.waitUntil(
		async () => isDeepStrictEqual(await readSettings(), resetState.settings),
		{
			interval: 50,
			timeout: 5_000,
			timeoutMsg: "The clean E2E settings were not persisted",
		},
	);

	return resetState;
};

export const readSettings = async (): Promise<E2ESettings> => {
	const result = await browser.executeAsync<ScriptResult<E2ESettings>, []>(
		(done) => {
			chrome.storage.sync.get("settings", (stored) => {
				const error = chrome.runtime.lastError;
				if (error) {
					done({ error: error.message, ok: false });
					return;
				}

				try {
					const value = stored.settings;
					done({
						ok: true,
						value:
							typeof value === "string"
								? (JSON.parse(value) as E2ESettings)
								: (value as E2ESettings),
					});
				} catch (parseError) {
					done({
						error:
							parseError instanceof Error
								? parseError.message
								: String(parseError),
						ok: false,
					});
				}
			});
		},
	);

	return unwrapScriptResult(result);
};

export const writeSettings = async (settings: E2ESettings): Promise<void> => {
	const result = await browser.executeAsync<ScriptResult<null>, [string]>(
		(serializedSettings, done) => {
			chrome.storage.sync.set({ settings: serializedSettings }, () => {
				const error = chrome.runtime.lastError;
				done(
					error
						? { error: error.message, ok: false }
						: { ok: true, value: null },
				);
			});
		},
		JSON.stringify(settings),
	);

	unwrapScriptResult(result);
};

export const readLocalStorage = async (
	keys?: string | string[],
): Promise<Record<string, unknown>> => {
	const result = await browser.executeAsync<
		ScriptResult<Record<string, unknown>>,
		[string | string[] | null]
	>((storageKeys, done) => {
		chrome.storage.local.get(storageKeys, (stored) => {
			const error = chrome.runtime.lastError;
			done(
				error
					? { error: error.message, ok: false }
					: { ok: true, value: stored },
			);
		});
	}, keys ?? null);

	return unwrapScriptResult(result);
};

export const writeLocalStorage = async (
	values: Record<string, unknown>,
): Promise<void> => {
	const result = await browser.executeAsync<
		ScriptResult<null>,
		[Record<string, unknown>]
	>((storageValues, done) => {
		chrome.storage.local.set(storageValues, () => {
			const error = chrome.runtime.lastError;
			done(
				error ? { error: error.message, ok: false } : { ok: true, value: null },
			);
		});
	}, values);

	unwrapScriptResult(result);
};

export const readBookmarkTree = async (): Promise<BookmarkNode[]> => {
	const result = await browser.executeAsync<ScriptResult<BookmarkNode[]>, []>(
		(done) => {
			chrome.bookmarks.getTree((tree) => {
				const error = chrome.runtime.lastError;
				done(
					error
						? { error: error.message, ok: false }
						: { ok: true, value: tree },
				);
			});
		},
	);

	return unwrapScriptResult(result);
};

export const createBookmarkFolder = async (
	title: string,
	parentId?: string,
): Promise<string> => {
	const result = await browser.executeAsync<
		ScriptResult<string>,
		[string, string | null]
	>(
		(folderTitle, folderParentId, done) => {
			chrome.bookmarks.create(
				{
					...(folderParentId ? { parentId: folderParentId } : {}),
					title: folderTitle,
				},
				(folder) => {
					const error = chrome.runtime.lastError;
					done(
						error
							? { error: error.message, ok: false }
							: { ok: true, value: folder.id },
					);
				},
			);
		},
		title,
		parentId ?? null,
	);

	return unwrapScriptResult(result);
};

export const createBookmark = async ({
	parentId,
	title,
	url,
}: {
	parentId?: string;
	title: string;
	url: string;
}): Promise<string> => {
	const result = await browser.executeAsync<
		ScriptResult<string>,
		[string, string, string | null]
	>(
		(bookmarkTitle, bookmarkUrl, bookmarkParentId, done) => {
			chrome.bookmarks.create(
				{
					...(bookmarkParentId ? { parentId: bookmarkParentId } : {}),
					title: bookmarkTitle,
					url: bookmarkUrl,
				},
				(bookmark) => {
					const error = chrome.runtime.lastError;
					done(
						error
							? { error: error.message, ok: false }
							: { ok: true, value: bookmark.id },
					);
				},
			);
		},
		title,
		url,
		parentId ?? null,
	);

	return unwrapScriptResult(result);
};
