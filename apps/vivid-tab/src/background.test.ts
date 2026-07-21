import {
	afterEach,
	beforeEach,
	describe,
	expect,
	jest,
	mock,
	test,
} from "@test/jest";
import {
	ALARMS,
	BACKGROUND_ACTIONS,
	EXTENSION_COMMANDS,
} from "@/constants/background-actions";
import { LOCAL_STORAGE } from "@/constants/keys";

type MessageListener = (
	message: unknown,
	sender: chrome.runtime.MessageSender,
	sendResponse: (response?: unknown) => void,
) => boolean | undefined;

type CommandListener = (command: string, tab?: chrome.tabs.Tab) => void;

const FIXED_NOW = new Date("2026-07-21T08:30:00.000Z");
const UNINSTALL_URL = "https://example.com/uninstalled";
const UPDATE_URL = "https://example.com/updated";
const originalChrome = globalThis.chrome;
const originalNodeEnvironment = process.env.NODE_ENV;
const originalUninstallUrl = process.env.PLASMO_PUBLIC_UNINSTALL_URL;
const originalUpdateUrl = process.env.PLASMO_PUBLIC_UPDATE_URL;

let messageListener: MessageListener | undefined;
let installedListener:
	| ((details: chrome.runtime.InstalledDetails) => void)
	| undefined;
let alarmListener: ((alarm: chrome.alarms.Alarm) => void) | undefined;
let commandListener: CommandListener | undefined;

const mockResolveRootFolder = mock(async (_rootFolderId: string) => "resolved");
const mockFetchOnlineImages = mock(async (_forceFetch?: boolean) => undefined);

jest.mock("@/lib/bookmarks", () => ({
	resolveBookmarkRootFolder: mockResolveRootFolder,
}));
jest.mock("@/lib/wallpapers/service", () => ({
	wallpaper: { fetchOnlineImages: mockFetchOnlineImages },
}));

const createTab = mock((_details: chrome.tabs.CreateProperties) => undefined);
const queryTabs = mock(
	(
		_query: chrome.tabs.QueryInfo,
		callback: (tabs: chrome.tabs.Tab[]) => void,
	) => callback([{ id: 7 } as chrome.tabs.Tab]),
);
const updateTab = mock(
	(_tabId: number, _details: chrome.tabs.UpdateProperties) => undefined,
);
const sendRuntimeMessage = mock(async (_message: unknown) => undefined);
const querySearch = mock((_details: chrome.search.QueryInfo) => undefined);
const setLocalStorage = mock(
	async (_values: Record<string, unknown>) => undefined,
);
const createAlarm = mock(
	(_name: string, _alarmInfo: chrome.alarms.AlarmCreateInfo) => undefined,
);
const clearAlarm = mock(async (_name: string) => true);
const setUninstallURL = mock(async (_url: string) => undefined);

const loadBackground = async (uninstallUrl: string | undefined) => {
	if (uninstallUrl === undefined) {
		delete process.env.PLASMO_PUBLIC_UNINSTALL_URL;
	} else {
		process.env.PLASMO_PUBLIC_UNINSTALL_URL = uninstallUrl;
	}

	await import("./background");
};

beforeEach(async () => {
	jest.resetModules();
	messageListener = undefined;
	installedListener = undefined;
	alarmListener = undefined;
	commandListener = undefined;

	createTab.mockClear();
	queryTabs.mockReset();
	queryTabs.mockImplementation((_query, callback) =>
		callback([{ id: 7 } as chrome.tabs.Tab]),
	);
	updateTab.mockClear();
	sendRuntimeMessage.mockReset();
	sendRuntimeMessage.mockImplementation(async () => undefined);
	querySearch.mockClear();
	setLocalStorage.mockClear();
	createAlarm.mockClear();
	clearAlarm.mockClear();
	setUninstallURL.mockClear();
	mockFetchOnlineImages.mockReset();
	mockFetchOnlineImages.mockImplementation(async () => undefined);
	mockResolveRootFolder.mockReset();
	mockResolveRootFolder.mockImplementation(async () => "resolved");

	globalThis.chrome = {
		alarms: {
			clear: clearAlarm,
			create: createAlarm,
			onAlarm: {
				addListener: (listener: (alarm: chrome.alarms.Alarm) => void) => {
					alarmListener = listener;
				},
			},
		},
		commands: {
			onCommand: {
				addListener: (listener: CommandListener) => {
					commandListener = listener;
				},
			},
		},
		runtime: {
			getURL: (path: string) => `chrome-extension://extension-id/${path}`,
			onInstalled: {
				addListener: (
					listener: (details: chrome.runtime.InstalledDetails) => void,
				) => {
					installedListener = listener;
				},
			},
			onMessage: {
				addListener: (listener: MessageListener) => {
					messageListener = listener;
				},
			},
			sendMessage: sendRuntimeMessage,
			setUninstallURL,
		},
		search: { query: querySearch },
		storage: { local: { set: setLocalStorage } },
		tabs: {
			create: createTab,
			query: queryTabs,
			update: updateTab,
		},
	} as unknown as typeof chrome;

	Reflect.set(process.env, "PLASMO_PUBLIC_UPDATE_URL", UPDATE_URL);
	await loadBackground(UNINSTALL_URL);
});

afterEach(() => {
	jest.useRealTimers();
	globalThis.chrome = originalChrome;
	if (originalNodeEnvironment === undefined) {
		delete process.env.NODE_ENV;
	} else {
		process.env.NODE_ENV = originalNodeEnvironment;
	}

	if (originalUninstallUrl === undefined) {
		delete process.env.PLASMO_PUBLIC_UNINSTALL_URL;
	} else {
		process.env.PLASMO_PUBLIC_UNINSTALL_URL = originalUninstallUrl;
	}

	if (originalUpdateUrl === undefined) {
		Reflect.deleteProperty(process.env, "PLASMO_PUBLIC_UPDATE_URL");
	} else {
		Reflect.set(process.env, "PLASMO_PUBLIC_UPDATE_URL", originalUpdateUrl);
	}
});

const dispatchRootMessage = (...rootFolderId: [unknown?]) =>
	new Promise<unknown>((resolve) => {
		const result = messageListener?.(
			{
				action: BACKGROUND_ACTIONS.ENSURE_ROOT_BOOKMARK_FOLDER,
				...(rootFolderId.length === 0 ? {} : { rootFolderId: rootFolderId[0] }),
			},
			{} as chrome.runtime.MessageSender,
			resolve,
		);

		expect(result).toBe(true);
	});

describe("background commands", () => {
	test("sends the typed toggle action to the current extension view", () => {
		commandListener?.(EXTENSION_COMMANDS.TOGGLE_VIVID_SEARCH, {
			id: 31,
		} as chrome.tabs.Tab);

		expect(queryTabs).not.toHaveBeenCalled();
		expect(sendRuntimeMessage).toHaveBeenCalledWith({
			action: BACKGROUND_ACTIONS.TOGGLE_VIVID_SEARCH,
			targetTabId: 31,
		});
	});

	test("does not depend on the active tab URL being available", () => {
		commandListener?.(EXTENSION_COMMANDS.TOGGLE_VIVID_SEARCH, {
			id: 41,
			url: "chrome-extension://extension-id/newtab.html",
		} as chrome.tabs.Tab);

		expect(sendRuntimeMessage).toHaveBeenCalledWith({
			action: BACKGROUND_ACTIONS.TOGGLE_VIVID_SEARCH,
			targetTabId: 41,
		});
	});

	test("queries the active tab when the browser omits the command tab", () => {
		queryTabs.mockImplementationOnce((_query, callback) =>
			callback([
				{
					id: 42,
					url: "https://example.com",
				} as chrome.tabs.Tab,
			]),
		);

		commandListener?.(EXTENSION_COMMANDS.TOGGLE_VIVID_SEARCH);

		expect(queryTabs).toHaveBeenCalledWith(
			{ active: true, currentWindow: true },
			expect.any(Function),
		);
		expect(sendRuntimeMessage).toHaveBeenCalledWith({
			action: BACKGROUND_ACTIONS.TOGGLE_VIVID_SEARCH,
			targetTabId: 42,
		});
	});

	test("ignores another command and an active query without a usable tab", () => {
		commandListener?.("another-command", { id: 31 } as chrome.tabs.Tab);
		expect(queryTabs).not.toHaveBeenCalled();

		queryTabs.mockImplementationOnce((_query, callback) => callback([]));
		commandListener?.(EXTENSION_COMMANDS.TOGGLE_VIVID_SEARCH);

		expect(sendRuntimeMessage).not.toHaveBeenCalled();
	});

	test("swallows extension-view runtime delivery failures", async () => {
		sendRuntimeMessage.mockRejectedValueOnce(new Error("View closed"));
		expect(() =>
			commandListener?.(EXTENSION_COMMANDS.TOGGLE_VIVID_SEARCH, {
				id: 41,
				url: "chrome-extension://extension-id/newtab.html?source=command",
			} as chrome.tabs.Tab),
		).not.toThrow();
		await Promise.resolve();

		sendRuntimeMessage.mockImplementationOnce(() => {
			throw new Error("Runtime unavailable");
		});
		expect(() =>
			commandListener?.(EXTENSION_COMMANDS.TOGGLE_VIVID_SEARCH, {
				id: 42,
				url: "chrome-extension://extension-id/newtab.html#search",
			} as chrome.tabs.Tab),
		).not.toThrow();
	});
});

describe("background messages", () => {
	test.each([
		null,
		undefined,
		42,
		"message",
		{},
		{ action: "unknown" },
	])("ignores malformed or unknown messages: %j", (message) => {
		expect(
			messageListener?.(
				message,
				{} as chrome.runtime.MessageSender,
				() => undefined,
			),
		).toBeUndefined();
	});

	test("resolves configured and missing bookmark root IDs asynchronously", async () => {
		await expect(dispatchRootMessage("configured")).resolves.toEqual({
			folderId: "resolved",
			ok: true,
		});
		expect(mockResolveRootFolder).toHaveBeenLastCalledWith("configured");

		await expect(dispatchRootMessage(42)).resolves.toEqual({
			folderId: "resolved",
			ok: true,
		});
		expect(mockResolveRootFolder).toHaveBeenLastCalledWith("");

		await expect(dispatchRootMessage()).resolves.toEqual({
			folderId: "resolved",
			ok: true,
		});
		expect(mockResolveRootFolder).toHaveBeenLastCalledWith("");
	});

	test("returns Error and non-Error bookmark failures", async () => {
		mockResolveRootFolder.mockImplementationOnce(async () => {
			throw new Error("bookmarks denied");
		});
		await expect(dispatchRootMessage()).resolves.toEqual({
			error: "bookmarks denied",
			ok: false,
		});

		mockResolveRootFolder.mockImplementationOnce(async () => {
			throw "unexpected failure";
		});
		await expect(dispatchRootMessage()).resolves.toEqual({
			error: "unexpected failure",
			ok: false,
		});
	});

	test("opens a resolved URL in a new tab without retaining the message port", () => {
		const result = messageListener?.(
			{
				action: BACKGROUND_ACTIONS.SEARCH_QUERY,
				openIn: "new-tab",
				query: "example.com/docs",
			},
			{} as chrome.runtime.MessageSender,
			() => undefined,
		);

		expect(result).toBeUndefined();
		expect(createTab).toHaveBeenCalledWith({
			url: "https://example.com/docs",
		});
	});

	test("opens a resolved URL in the current tab", () => {
		messageListener?.(
			{
				action: BACKGROUND_ACTIONS.SEARCH_QUERY,
				openIn: "current-tab",
				query: "https://example.org",
			},
			{} as chrome.runtime.MessageSender,
			() => undefined,
		);

		expect(queryTabs).toHaveBeenCalledWith(
			{ active: true, currentWindow: true },
			expect.any(Function),
		);
		expect(updateTab).toHaveBeenCalledWith(7, {
			url: "https://example.org",
		});
	});

	test.each([
		{ tabs: [] },
		{ tabs: [{} as chrome.tabs.Tab] },
	])("does not update when the active tab has no usable ID", ({ tabs }) => {
		queryTabs.mockImplementationOnce((_query, callback) => callback(tabs));

		messageListener?.(
			{
				action: BACKGROUND_ACTIONS.SEARCH_QUERY,
				openIn: "current-tab",
				query: "example.com",
			},
			{} as chrome.runtime.MessageSender,
			() => undefined,
		);

		expect(updateTab).not.toHaveBeenCalled();
	});

	test.each([
		["new-tab", "NEW_TAB"],
		["current-tab", "CURRENT_TAB"],
	] as const)("delegates text to browser search in %s", (openIn, disposition) => {
		messageListener?.(
			{
				action: BACKGROUND_ACTIONS.SEARCH_QUERY,
				openIn,
				query: "two words",
			},
			{} as chrome.runtime.MessageSender,
			() => undefined,
		);

		expect(querySearch).toHaveBeenLastCalledWith({
			disposition,
			text: "two words",
		});
	});

	test("passes an untrusted or absent query through the safe resolver", () => {
		for (const message of [
			{
				action: BACKGROUND_ACTIONS.SEARCH_QUERY,
				openIn: "current-tab",
				query: { unexpected: true },
			},
			{
				action: BACKGROUND_ACTIONS.SEARCH_QUERY,
				openIn: "current-tab",
			},
		]) {
			messageListener?.(
				message,
				{} as chrome.runtime.MessageSender,
				() => undefined,
			);
			expect(querySearch).toHaveBeenLastCalledWith({
				disposition: "CURRENT_TAB",
				text: "",
			});
		}
	});

	test.each([
		undefined,
		null,
		"side-panel",
		1,
	])("ignores an invalid search destination: %j", (openIn) => {
		messageListener?.(
			{
				action: BACKGROUND_ACTIONS.SEARCH_QUERY,
				openIn,
				query: "example.com",
			},
			{} as chrome.runtime.MessageSender,
			() => undefined,
		);

		expect(createTab).not.toHaveBeenCalled();
		expect(queryTabs).not.toHaveBeenCalled();
		expect(querySearch).not.toHaveBeenCalled();
	});

	test("ignores a search message without a destination field", () => {
		messageListener?.(
			{ action: BACKGROUND_ACTIONS.SEARCH_QUERY },
			{} as chrome.runtime.MessageSender,
			() => undefined,
		);

		expect(querySearch).not.toHaveBeenCalled();
		expect(queryTabs).not.toHaveBeenCalled();
		expect(createTab).not.toHaveBeenCalled();
	});
});

describe("background lifecycle", () => {
	test("keeps lifecycle redirects disabled during development", async () => {
		jest.resetModules();
		process.env.NODE_ENV = "development";
		setUninstallURL.mockClear();
		await loadBackground(UNINSTALL_URL);

		installedListener?.({
			reason: "install",
		} as chrome.runtime.InstalledDetails);
		installedListener?.({
			reason: "update",
		} as chrome.runtime.InstalledDetails);

		expect(createTab).not.toHaveBeenCalled();
		expect(setUninstallURL).not.toHaveBeenCalled();
		expect(setLocalStorage).toHaveBeenCalledTimes(1);
		expect(mockFetchOnlineImages).toHaveBeenCalledWith(true);
		expect(createAlarm).toHaveBeenCalledTimes(2);
	});

	test("runs onboarding, metadata, wallpaper, and alarm setup on install", () => {
		jest.useFakeTimers();
		jest.setSystemTime(FIXED_NOW);

		installedListener?.({
			reason: "install",
		} as chrome.runtime.InstalledDetails);

		expect(createTab).toHaveBeenCalledWith({
			url: "chrome-extension://extension-id/tabs/welcome.html",
		});
		expect(setLocalStorage).toHaveBeenCalledWith({
			[LOCAL_STORAGE.installedDate]: FIXED_NOW.toString(),
		});
		expect(mockFetchOnlineImages).toHaveBeenCalledWith(true);
		expect(createAlarm).toHaveBeenCalledWith(ALARMS.FETCH_ONLINE_IMAGES, {
			periodInMinutes: 180,
		});
		expect(clearAlarm).toHaveBeenCalledWith("DOWNLOAD_PENDING_IMAGES");
	});

	test("opens the configured update page and refreshes alarms after an update", () => {
		installedListener?.({
			reason: "update",
		} as chrome.runtime.InstalledDetails);

		expect(createTab).toHaveBeenCalledWith({ url: UPDATE_URL });
		expect(setLocalStorage).not.toHaveBeenCalled();
		expect(mockFetchOnlineImages).not.toHaveBeenCalled();
		expect(createAlarm).toHaveBeenCalledTimes(1);
		expect(clearAlarm).toHaveBeenCalledTimes(1);
	});

	test("trims the configured update URL", () => {
		Reflect.set(process.env, "PLASMO_PUBLIC_UPDATE_URL", `  ${UPDATE_URL}  `);

		installedListener?.({
			reason: "update",
		} as chrome.runtime.InstalledDetails);

		expect(createTab).toHaveBeenCalledWith({ url: UPDATE_URL });
	});

	test.each([
		undefined,
		"",
		"   ",
	])("does not open an update page when its URL is absent: %j", (updateUrl) => {
		if (updateUrl === undefined) {
			Reflect.deleteProperty(process.env, "PLASMO_PUBLIC_UPDATE_URL");
		} else {
			Reflect.set(process.env, "PLASMO_PUBLIC_UPDATE_URL", updateUrl);
		}

		installedListener?.({
			reason: "update",
		} as chrome.runtime.InstalledDetails);

		expect(createTab).not.toHaveBeenCalled();
		expect(createAlarm).toHaveBeenCalledTimes(1);
		expect(clearAlarm).toHaveBeenCalledTimes(1);
	});

	test.each([
		"chrome_update",
		"shared_module_update",
		"unexpected",
	])("does not redirect for the unsupported install reason: %s", (reason) => {
		installedListener?.({
			reason,
		} as chrome.runtime.InstalledDetails);

		expect(createTab).not.toHaveBeenCalled();
		expect(setLocalStorage).not.toHaveBeenCalled();
		expect(mockFetchOnlineImages).not.toHaveBeenCalled();
		expect(createAlarm).toHaveBeenCalledTimes(1);
		expect(clearAlarm).toHaveBeenCalledTimes(1);
	});

	test("refreshes wallpapers only for the matching alarm", () => {
		alarmListener?.({
			name: "another-feature",
			persistAcrossSessions: true,
			scheduledTime: 0,
		});
		expect(mockFetchOnlineImages).not.toHaveBeenCalled();

		alarmListener?.({
			name: ALARMS.FETCH_ONLINE_IMAGES,
			persistAcrossSessions: true,
			scheduledTime: 0,
		});
		expect(mockFetchOnlineImages).toHaveBeenCalledWith();
	});
});

describe("background startup", () => {
	test("registers a trimmed uninstall URL", () => {
		expect(setUninstallURL).toHaveBeenCalledWith(UNINSTALL_URL);
	});

	test.each([
		undefined,
		"",
		"   ",
	])("ignores an absent uninstall URL: %j", async (uninstallUrl) => {
		setUninstallURL.mockClear();
		jest.resetModules();

		await loadBackground(uninstallUrl);

		expect(setUninstallURL).not.toHaveBeenCalled();
	});

	test("trims surrounding uninstall URL whitespace", async () => {
		setUninstallURL.mockClear();
		jest.resetModules();

		await loadBackground(`  ${UNINSTALL_URL}  `);

		expect(setUninstallURL).toHaveBeenCalledWith(UNINSTALL_URL);
	});
});
