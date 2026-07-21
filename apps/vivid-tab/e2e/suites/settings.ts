import { isDeepStrictEqual } from "node:util";
import { $, browser, expect } from "@wdio/globals";
import { DEFAULT_SETTINGS } from "../../src/constants/settings";
import {
	createBookmark,
	createBookmarkFolder,
	type E2ESettings,
	openExtensionPage,
	readLocalStorage,
	readSettings,
	resetExtensionState,
	writeLocalStorage,
	writeSettings,
} from "../support/extension";

type BrowserName = "chromium" | "firefox";

const SETTINGS_PERSISTENCE_TIMEOUT_MS = 5_000;
const LAST_ONLINE_IMAGES_FETCHED_AT = "vivid-tab.last-online-images-fetched-at";
const LAST_WALLPAPER_CHANGED_AT = "vivid-tab.last-wallpaper-changed-at";
const NOTES_STORAGE_KEY = "notes";
const TODOS_STORAGE_KEY = "todos";

const byAccessibleName = (name: string) => $(`aria/${name}`);

const openSettingsDialog = async () => {
	await openExtensionPage("newtab");

	const trigger = byAccessibleName("Open settings");
	await expect(trigger).toBeDisplayed();
	await trigger.click();

	const dialog = $('[role="dialog"]');
	await expect(dialog).toBeDisplayed();

	return dialog;
};

const openSettingsTab = async (label: string) => {
	const navigation = $('nav[aria-label="Settings sections"]');
	await expect(navigation).toBeDisplayed();
	await navigation.$(`button=${label}`).click();
};

const chooseSelectOption = async (controlId: string, label: string) => {
	const trigger = $(`#${controlId}`);
	await expect(trigger).toBeClickable();
	await trigger.click();

	const option = $(`//*[@role="option" and normalize-space(.)="${label}"]`);
	await expect(option).toBeDisplayed();
	await option.click();
	await expect(trigger).toHaveText(expect.stringContaining(label));
};

const setSwitch = async (controlId: string, checked: boolean) => {
	const control = $(`#${controlId}`);
	await expect(control).toBeDisplayed();

	if ((await control.getAttribute("aria-checked")) !== String(checked)) {
		await control.click();
	}

	await expect(control).toHaveAttribute("aria-checked", String(checked));
};

const setCheckbox = async (controlId: string, checked: boolean) => {
	const control = $(`#${controlId}`);
	await expect(control).toBeDisplayed();

	if ((await control.getAttribute("aria-checked")) !== String(checked)) {
		await control.click();
	}

	await expect(control).toHaveAttribute("aria-checked", String(checked));
};

/** Dispatches the same bubbling input event in Chromium and Firefox. */
const setNumberInputValue = async (controlId: string, value: string) => {
	const input = $(`#${controlId}`);
	await expect(input).toBeDisplayed();

	await browser.execute(
		(id, nextValue) => {
			const element = document.getElementById(id);
			if (!(element instanceof HTMLInputElement)) {
				throw new Error(`Number input not found: ${id}`);
			}

			const valueSetter = Object.getOwnPropertyDescriptor(
				HTMLInputElement.prototype,
				"value",
			)?.set;
			if (!valueSetter)
				throw new Error("Native input value setter is unavailable");

			valueSetter.call(element, nextValue);
			element.dispatchEvent(new Event("input", { bubbles: true }));
		},
		controlId,
		value,
	);
};

const saveSettingsDialog = async () => {
	const dialog = $('[role="dialog"]');
	await dialog.$("button=Save").click();
	await dialog.waitForExist({ reverse: true });
};

const cancelSettingsDialog = async () => {
	const dialog = $('[role="dialog"]');
	await dialog.$("button=Cancel").click();
	await dialog.waitForExist({ reverse: true });
};

const waitForSettings = async (
	predicate: (settings: E2ESettings) => boolean,
	timeoutMessage: string,
) => {
	await browser.waitUntil(async () => predicate(await readSettings()), {
		interval: 50,
		timeout: SETTINGS_PERSISTENCE_TIMEOUT_MS,
		timeoutMsg: timeoutMessage,
	});

	return readSettings();
};

const expectAppearanceAttributes = async (
	theme: E2ESettings["appearance"]["theme"],
	radius: E2ESettings["appearance"]["radius"],
	visualEffect: E2ESettings["appearance"]["visualEffect"],
) => {
	await expect($("html")).toHaveAttribute("data-theme", theme);
	await expect($("body")).toHaveAttribute("data-radius", radius);
	await expect($("body")).toHaveAttribute("data-visual-effect", visualEffect);
};

const setSliderToBoundary = async (
	controlId: string,
	boundary: "minimum" | "maximum",
) => {
	const thumb = $(`#${controlId} [role="slider"]`);
	await expect(thumb).toBeDisplayed();
	await thumb.click();
	await browser.keys([boundary === "minimum" ? "\uE011" : "\uE010"]);
};

const installSettingsFilePicker = async (fileContents: string) => {
	await browser.execute((contents) => {
		type ImportWindow = Window & {
			__vividTabSettingsImportMessage?: string;
		};
		const pageWindow = window as ImportWindow;
		const originalClick = HTMLInputElement.prototype.click;
		pageWindow.__vividTabSettingsImportMessage = undefined;
		window.alert = (message) => {
			pageWindow.__vividTabSettingsImportMessage = String(message);
		};

		HTMLInputElement.prototype.click = function () {
			if (this.type !== "file") {
				originalClick.call(this);
				return;
			}

			const file = new File([contents], "vivid-tab-settings.json", {
				type: "application/json",
			});
			Object.defineProperty(this, "files", {
				configurable: true,
				value: [file],
			});
			this.dispatchEvent(new Event("change", { bubbles: true }));
		};
	}, fileContents);
};

const readSettingsImportMessage = () =>
	browser.execute(() => {
		type ImportWindow = Window & {
			__vividTabSettingsImportMessage?: string;
		};

		return (window as ImportWindow).__vividTabSettingsImportMessage;
	});

interface ExportCapture {
	download?: string;
	text?: string;
}

const installSettingsExportCapture = async () => {
	await browser.execute(() => {
		type ExportWindow = Window & {
			__vividTabSettingsExport?: ExportCapture;
		};
		const pageWindow = window as ExportWindow;
		pageWindow.__vividTabSettingsExport = {};

		Object.defineProperty(URL, "createObjectURL", {
			configurable: true,
			value: (blob: Blob) => {
				void blob.text().then((text) => {
					pageWindow.__vividTabSettingsExport = {
						...pageWindow.__vividTabSettingsExport,
						text,
					};
				});

				return "blob:vivid-tab-e2e";
			},
		});
		Object.defineProperty(URL, "revokeObjectURL", {
			configurable: true,
			value: () => undefined,
		});
		HTMLAnchorElement.prototype.click = function () {
			pageWindow.__vividTabSettingsExport = {
				...pageWindow.__vividTabSettingsExport,
				download: this.download,
			};
		};
	});
};

const readSettingsExportCapture = () =>
	browser.execute(() => {
		type ExportWindow = Window & {
			__vividTabSettingsExport?: ExportCapture;
		};

		return (window as ExportWindow).__vividTabSettingsExport;
	});

const importSettingsFile = async (fileContents: string) => {
	await installSettingsFilePicker(fileContents);
	await byAccessibleName("Import").click();
	await browser.waitUntil(
		async () => Boolean(await readSettingsImportMessage()),
		{
			interval: 50,
			timeout: SETTINGS_PERSISTENCE_TIMEOUT_MS,
			timeoutMsg: "Settings import did not show a result",
		},
	);

	return readSettingsImportMessage();
};

const createFactorySettings = (rootFolder: string): E2ESettings => {
	const settings = structuredClone(DEFAULT_SETTINGS) as unknown as E2ESettings;
	settings.general.rootFolder = rootFolder;

	return settings;
};

const uploadWallpaperFixture = async () => {
	await browser.execute(() => {
		const input = document.querySelector<HTMLInputElement>(
			'input[type="file"][accept="image/*"]',
		);
		if (!input) throw new Error("Wallpaper upload input was not found");

		const binary = atob(
			"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL+WQAAAABJRU5ErkJggg==",
		);
		const bytes = Uint8Array.from(binary, (character) =>
			character.charCodeAt(0),
		);
		const file = new File([bytes], "settings-reset-wallpaper.png", {
			type: "image/png",
		});

		Object.defineProperty(input, "files", {
			configurable: true,
			value: [file],
		});
		input.dispatchEvent(new Event("change", { bubbles: true }));
	});
};

type WallpaperDatabaseResult =
	| { ids: string[]; ok: true }
	| { error: string; ok: false };

const readWallpaperDatabaseIds = async () => {
	const result = await browser.executeAsync<WallpaperDatabaseResult, []>(
		(done) => {
			const request = indexedDB.open("ImageDB", 2);
			request.onupgradeneeded = () => {
				if (!request.result.objectStoreNames.contains("images")) {
					request.result.createObjectStore("images", { keyPath: "id" });
				}
			};
			request.onerror = () =>
				done({
					error: request.error?.message ?? "Unable to open ImageDB",
					ok: false,
				});
			request.onsuccess = () => {
				const database = request.result;
				const transaction = database.transaction("images", "readonly");
				const keysRequest = transaction.objectStore("images").getAllKeys();
				let ids: string[] = [];

				keysRequest.onsuccess = () => {
					ids = keysRequest.result.map(String);
				};
				transaction.oncomplete = () => {
					database.close();
					done({ ids, ok: true });
				};
				transaction.onerror = () => {
					database.close();
					done({
						error: transaction.error?.message ?? "Unable to read ImageDB",
						ok: false,
					});
				};
			};
		},
	);

	if (result.ok === false) throw new Error(result.error);

	return result.ids;
};

/** Runs the complete settings journey against both packaged browser targets. */
export const runSettingsSuite = (browserName: BrowserName) => {
	describe(`Settings journeys (${browserName})`, () => {
		beforeEach(async () => {
			await resetExtensionState();
		});

		it("renders every grouped settings tab", async () => {
			await openSettingsDialog();

			const tabs = [
				["General", "#settings-root-folder"],
				["Appearance", "#settings-theme"],
				["Layout", "#searchbar"],
				["Wallpaper", "#online-images-toggle"],
				["Background", "#settings-background-blur"],
				["Search bar", "#settings-search-suggestions"],
				["Timer", "#settings-time-format"],
				["Weather", "#settings-temperature-unit"],
				["Quotes", "#technology"],
				["Todos", "#settings-expire-todos"],
				["Backup & export", "button=Import"],
				["Support", "h3=GitHub"],
			] as const;

			for (const [label, selector] of tabs) {
				await openSettingsTab(label);
				await expect($(selector)).toBeDisplayed();
			}
		});

		it("applies appearance immediately, rolls Cancel back, and persists Save across reload", async () => {
			const original = await readSettings();
			await openSettingsDialog();
			await openSettingsTab("Appearance");

			await chooseSelectOption("settings-theme", "Tokyo Night");
			await chooseSelectOption("settings-radius", "None");
			await chooseSelectOption("settings-visual-effect", "Opaque");
			await expectAppearanceAttributes("tokyo-night", "none", "opaque");
			await waitForSettings(
				(settings) =>
					settings.appearance.theme === "tokyo-night" &&
					settings.appearance.radius === "none" &&
					settings.appearance.visualEffect === "opaque",
				"Appearance changes were not persisted before rollback",
			);

			await cancelSettingsDialog();
			await expectAppearanceAttributes(
				original.appearance.theme,
				original.appearance.radius,
				original.appearance.visualEffect,
			);
			await waitForSettings(
				(settings) =>
					settings.appearance.theme === original.appearance.theme &&
					settings.appearance.radius === original.appearance.radius &&
					settings.appearance.visualEffect === original.appearance.visualEffect,
				"Cancel did not restore persisted appearance settings",
			);

			await openSettingsDialog();
			await openSettingsTab("Appearance");
			await chooseSelectOption("settings-theme", "Catppuccin Mocha");
			await chooseSelectOption("settings-radius", "Small");
			await chooseSelectOption("settings-visual-effect", "Opaque");
			await saveSettingsDialog();

			await waitForSettings(
				(settings) =>
					settings.appearance.theme === "catppuccin-mocha" &&
					settings.appearance.radius === "sm" &&
					settings.appearance.visualEffect === "opaque",
				"Saved appearance settings were not persisted",
			);
			await browser.refresh();
			await expectAppearanceAttributes("catppuccin-mocha", "sm", "opaque");
		});

		it("persists general bookmark, layout, browsing, and link-target controls", async () => {
			const alternateFolderId = await createBookmarkFolder(
				"Settings alternate root",
			);
			await createBookmark({
				parentId: alternateFolderId,
				title: "Alternate root bookmark",
				url: "https://example.com/settings-root",
			});

			await openSettingsDialog();
			await chooseSelectOption(
				"settings-root-folder",
				"Settings alternate root",
			);
			await chooseSelectOption("settings-bookmark-layout", "List");
			await setSwitch("settings-bookmark-extra-space", false);
			await setSwitch("settings-show-history", true);
			await setSwitch("settings-show-top-sites", true);
			await chooseSelectOption("settings-open-url", "New tab");
			await saveSettingsDialog();

			await waitForSettings(
				(settings) =>
					settings.general.rootFolder === alternateFolderId &&
					settings.general.layout === "list" &&
					!settings.general.bookmarksCanTakeExtraSpaceIfAvailable &&
					settings.general.showHistory &&
					settings.general.showTopSites &&
					settings.general.openUrlIn === "new-tab",
				"General settings were not persisted",
			);

			await browser.refresh();
			await openSettingsDialog();
			await expect($("#settings-root-folder")).toHaveText(
				expect.stringContaining("Settings alternate root"),
			);
			await expect($("#settings-bookmark-layout")).toHaveText("List");
			await expect($("#settings-show-history")).toHaveAttribute(
				"aria-checked",
				"true",
			);
			await expect($("#settings-show-top-sites")).toHaveAttribute(
				"aria-checked",
				"true",
			);
			await expect($("#settings-open-url")).toHaveText("New tab");
		});

		it("persists hiding and restoring a layout widget", async () => {
			await openSettingsDialog();
			await openSettingsTab("Layout");
			await setCheckbox("weather", false);
			await saveSettingsDialog();

			await waitForSettings(
				(settings) =>
					!Object.values(settings.widgets.layout).includes("weather"),
				"Hidden weather widget was not persisted",
			);

			await browser.refresh();
			await openSettingsDialog();
			await openSettingsTab("Layout");
			await expect($("#weather")).toHaveAttribute("aria-checked", "false");
			await setCheckbox("weather", true);
			await saveSettingsDialog();

			await waitForSettings(
				(settings) =>
					Object.values(settings.widgets.layout).includes("weather"),
				"Restored weather widget was not persisted",
			);
		});

		it("persists search suggestions, timer, and weather controls", async () => {
			await openSettingsDialog();
			await openSettingsTab("Search bar");
			if (browserName === "firefox") {
				await expect($("#settings-search-suggestions")).toBeDisabled();
			} else {
				await setSwitch("settings-search-suggestions", true);
			}

			await openSettingsTab("Timer");
			await chooseSelectOption("settings-time-format", "24-hour");
			await setSwitch("settings-show-seconds", true);

			await openSettingsTab("Weather");
			await chooseSelectOption("settings-temperature-unit", "Fahrenheit");
			await saveSettingsDialog();

			const settings = await waitForSettings(
				(current) =>
					current.widgets.searchbar.searchSuggestions ===
						(browserName !== "firefox") &&
					current.widgets.timer.timeFormat === "24h" &&
					current.widgets.timer.showSeconds &&
					current.widgets.temperature.unit === "fahrenheit",
				"Widget settings were not persisted",
			);
			expect(settings.widgets.searchbar.searchSuggestions).toBe(
				browserName !== "firefox",
			);
			expect(settings.widgets.timer).toEqual({
				showSeconds: true,
				timeFormat: "24h",
			});
			expect(settings.widgets.temperature.unit).toBe("fahrenheit");
		});

		it("persists quote categories and handles todo duration boundaries", async () => {
			await openSettingsDialog();
			await openSettingsTab("Quotes");
			await setCheckbox("technology", true);
			await byAccessibleName("Clear quote categories").click();
			await expect($("#technology")).toHaveAttribute("aria-checked", "false");
			await waitForSettings(
				(settings) => settings.widgets.quotes.categories.length === 0,
				"Quote categories were not cleared",
			);
			await setCheckbox("technology", true);

			await openSettingsTab("Todos");
			await setSwitch("settings-expire-todos", false);
			await expect($("#settings-todo-expiration")).toBeDisabled();
			await setSwitch("settings-expire-todos", true);
			await expect($("#settings-todo-expiration")).toBeEnabled();

			await setNumberInputValue("settings-todo-expiration", "-1");
			await openSettingsTab("Timer");
			await openSettingsTab("Todos");
			await expect($("#settings-todo-expiration")).toHaveValue("60");

			await setNumberInputValue("settings-todo-expiration", "0");
			await waitForSettings(
				(settings) =>
					settings.widgets.todos.expireAfterCompleted.durationInMinutes === 0,
				"The zero-minute todo boundary was not persisted",
			);
			await setNumberInputValue("settings-todo-expiration", "525600");
			await saveSettingsDialog();

			const settings = await waitForSettings(
				(current) =>
					current.widgets.quotes.categories.includes("technology") &&
					current.widgets.todos.expireAfterCompleted.enabled &&
					current.widgets.todos.expireAfterCompleted.durationInMinutes ===
						525_600,
				"Quote and todo settings were not persisted",
			);
			expect(settings.widgets.quotes.categories).toContain("technology");
			expect(
				settings.widgets.todos.expireAfterCompleted.durationInMinutes,
			).toBe(525_600);
		});

		it("rejects todo overflow without resetting unrelated settings", async () => {
			const expected = structuredClone(await readSettings());
			expected.appearance.theme = "tokyo-night";
			expected.general.layout = "list";

			await openSettingsDialog();
			await openSettingsTab("Appearance");
			await chooseSelectOption("settings-theme", "Tokyo Night");
			await openSettingsTab("General");
			await chooseSelectOption("settings-bookmark-layout", "List");
			await openSettingsTab("Todos");
			await expect($("#settings-todo-expiration")).toHaveAttribute(
				"max",
				"525600",
			);
			await setNumberInputValue("settings-todo-expiration", "525601");

			/* Remounting exposes whether React accepted the invalid controlled value. */
			await openSettingsTab("Timer");
			await openSettingsTab("Todos");
			await expect($("#settings-todo-expiration")).toHaveValue("60");
			await saveSettingsDialog();

			const persisted = await waitForSettings(
				(settings) => isDeepStrictEqual(settings, expected),
				"Todo overflow changed or reset unrelated settings",
			);
			expect(persisted).toEqual(expected);
			await browser.refresh();
			expect(await readSettings()).toEqual(expected);
			await expect($("html")).toHaveAttribute("data-theme", "tokyo-night");
		});

		it("persists background slider boundaries and rotation", async () => {
			await openSettingsDialog();
			await openSettingsTab("Background");
			await setSliderToBoundary("settings-background-blur", "minimum");
			await expect($('label[for="settings-background-blur"]')).toHaveText(
				"Blur (0px)",
			);
			await setSliderToBoundary("settings-background-brightness", "maximum");
			await expect($('label[for="settings-background-brightness"]')).toHaveText(
				"Brightness (100%)",
			);
			await chooseSelectOption("settings-randomize-wallpaper", "Daily");
			await saveSettingsDialog();

			const background = (
				await waitForSettings(
					(settings) =>
						settings.appearance.background.blurIntensity === 0 &&
						settings.appearance.background.brightness === 10 &&
						settings.appearance.background.randomizeWallpaper === "daily",
					"Background settings were not persisted",
				)
			).appearance.background;
			expect(background).toEqual({
				blurIntensity: 0,
				brightness: 10,
				randomizeWallpaper: "daily",
			});
		});

		it("persists online wallpaper controls", async () => {
			await openSettingsDialog();
			await openSettingsTab("Wallpaper");
			await expect($("#keywords-input")).toBeDisabled();
			await setSwitch("online-images-toggle", true);
			await expect($("#keywords-input")).toBeEnabled();
			await $("#keywords-input").setValue(
				"anime, superhero, comics, watercolor",
			);
			await saveSettingsDialog();

			await waitForSettings(
				(settings) =>
					settings.appearance.wallpapers.onlineImages.enabled &&
					settings.appearance.wallpapers.onlineImages.keywords ===
						"anime, superhero, comics, watercolor",
				"Online wallpaper settings were not persisted",
			);
		});

		it("fully resets preferences and wallpapers while preserving notes and todos", async () => {
			const { rootFolderId } = await resetExtensionState({
				configureSettings: (settings) => {
					settings.general.bookmarksCanTakeExtraSpaceIfAvailable = false;
					settings.general.layout = "list";
					settings.general.openUrlIn = "new-tab";
					settings.general.showHistory = true;
					settings.general.showTopSites = true;
					settings.widgets.quotes.categories = ["technology"];
					settings.widgets.searchbar.searchSuggestions = true;
					settings.widgets.temperature.unit = "fahrenheit";
					settings.widgets.timer.showSeconds = true;
					settings.widgets.timer.timeFormat = "24h";
					settings.widgets.todos.expireAfterCompleted.enabled = false;
					settings.widgets.todos.expireAfterCompleted.durationInMinutes = 1_440;
					settings.appearance.background.blurIntensity = 0;
					settings.appearance.background.brightness = 10;
					settings.appearance.background.randomizeWallpaper = "daily";
					settings.appearance.radius = "none";
					settings.appearance.theme = "tokyo-night";
					settings.appearance.visualEffect = "opaque";
					settings.appearance.wallpapers.onlineImages.keywords =
						"custom reset terms";
				},
			});
			if (!rootFolderId)
				throw new Error("Factory reset requires a root folder");

			const note = {
				createdAt: 1_784_620_000_000,
				id: 1_784_620_000_000,
				text: "Note survives factory reset",
			};
			const todo = {
				completed: false,
				completedAt: null,
				id: 1_784_620_000_001,
				text: "Todo survives factory reset",
			};
			const serializedNotes = JSON.stringify([note]);
			const serializedTodos = JSON.stringify([todo]);
			await writeLocalStorage({
				[LAST_ONLINE_IMAGES_FETCHED_AT]: "100",
				[LAST_WALLPAPER_CHANGED_AT]: Date.now().toString(),
				[NOTES_STORAGE_KEY]: serializedNotes,
				[TODOS_STORAGE_KEY]: serializedTodos,
			});

			await openSettingsDialog();
			await openSettingsTab("Wallpaper");
			await uploadWallpaperFixture();
			const uploadedSettings = await waitForSettings(
				(settings) => settings.appearance.wallpapers.images.length === 1,
				"Uploaded wallpaper was not persisted before reset",
			);
			const uploadedWallpaperId =
				uploadedSettings.appearance.wallpapers.images[0];
			if (!uploadedWallpaperId) throw new Error("Uploaded wallpaper has no ID");
			expect(await readWallpaperDatabaseIds()).toContain(uploadedWallpaperId);
			await byAccessibleName("Use this wallpaper").click();
			const wallpaperConfirmation = $('[role="alertdialog"]');
			await expect(wallpaperConfirmation).toBeDisplayed();
			await wallpaperConfirmation.$("button=Cancel").click();
			await wallpaperConfirmation.waitForExist({ reverse: true });
			expect(
				(await readSettings()).appearance.wallpapers.selectedImageId,
			).toBeNull();
			expect(
				(await readSettings()).appearance.background.randomizeWallpaper,
			).toBe("daily");

			await byAccessibleName("Use this wallpaper").click();
			await $('[role="alertdialog"]').$("button=Set wallpaper").click();
			await waitForSettings(
				(settings) =>
					settings.appearance.wallpapers.selectedImageId ===
						uploadedWallpaperId &&
					settings.appearance.background.randomizeWallpaper === "off",
				"Uploaded wallpaper was not selected before reset",
			);

			await openSettingsTab("General");
			await byAccessibleName("Reset").click();
			await byAccessibleName("Reset settings").click();
			const expected = createFactorySettings(rootFolderId);
			const resetSettings = await waitForSettings(
				(settings) => isDeepStrictEqual(settings, expected),
				"Factory reset did not restore every preference",
			);
			expect(resetSettings).toEqual(expected);
			expect(await readWallpaperDatabaseIds()).toEqual([]);

			const localStorage = await readLocalStorage([
				LAST_ONLINE_IMAGES_FETCHED_AT,
				LAST_WALLPAPER_CHANGED_AT,
				NOTES_STORAGE_KEY,
				TODOS_STORAGE_KEY,
			]);
			expect(localStorage[LAST_ONLINE_IMAGES_FETCHED_AT]).toBeUndefined();
			expect(localStorage[LAST_WALLPAPER_CHANGED_AT]).toBeUndefined();
			expect(localStorage[NOTES_STORAGE_KEY]).toBe(serializedNotes);
			expect(localStorage[TODOS_STORAGE_KEY]).toBe(serializedTodos);

			await saveSettingsDialog();
			await browser.refresh();
			expect(await readSettings()).toEqual(expected);
		});

		it("imports and exports the current settings through the backup tab", async () => {
			const imported = await readSettings();
			imported.appearance.theme = "tokyo-night";
			imported.general.layout = "list";
			imported.widgets.timer.showSeconds = true;

			await openSettingsDialog();
			await openSettingsTab("Backup & export");
			const importMessage = await importSettingsFile(
				JSON.stringify({ settings: imported }),
			);
			expect(importMessage).toBe("Settings imported successfully.");
			await waitForSettings(
				(settings) =>
					settings.appearance.theme === "tokyo-night" &&
					settings.general.layout === "list" &&
					settings.widgets.timer.showSeconds,
				"Imported settings were not persisted",
			);

			await installSettingsExportCapture();
			await byAccessibleName("Export").click();
			await browser.waitUntil(
				async () => Boolean((await readSettingsExportCapture())?.text),
				{
					interval: 50,
					timeout: SETTINGS_PERSISTENCE_TIMEOUT_MS,
					timeoutMsg: "Settings export was not produced",
				},
			);

			const capture = await readSettingsExportCapture();
			expect(capture?.download).toMatch(
				/^vivid-tab-settings-\d{4}-\d{2}-\d{2}\.json$/,
			);
			expect(JSON.parse(capture?.text ?? "null")).toEqual({
				settings: await readSettings(),
			});
		});

		for (const [caseName, fileContents] of [
			["malformed JSON", "{"],
			[
				"schema-invalid JSON",
				JSON.stringify({
					settings: { appearance: { theme: "invalid-theme" }, version: 1 },
				}),
			],
		] as const) {
			it(`rejects ${caseName} without changing current settings`, async () => {
				const existing = await readSettings();
				existing.appearance.theme = "tokyo-night";
				existing.general.layout = "list";
				existing.widgets.timer.showSeconds = true;
				await writeSettings(existing);

				await openSettingsDialog();
				await openSettingsTab("Backup & export");
				expect(await importSettingsFile(fileContents)).toBe(
					"Invalid settings. Your current settings were not changed.",
				);

				const persisted = await waitForSettings(
					(settings) => isDeepStrictEqual(settings, existing),
					`${caseName} changed the current settings`,
				);
				expect(persisted).toEqual(existing);

				await browser.refresh();
				await expectAppearanceAttributes(
					existing.appearance.theme,
					existing.appearance.radius,
					existing.appearance.visualEffect,
				);
				expect(await readSettings()).toEqual(existing);
			});
		}

		it("opens both support review paths without leaving the extension", async () => {
			await openSettingsDialog();
			await openSettingsTab("Support");
			await expect(
				$('a[href="https://github.com/jrtilak/vivid-tab"]'),
			).toBeDisplayed();
			await $(
				'//h3[normalize-space(.)="Leave a Review"]/ancestor::button',
			).click();
			await expect(byAccessibleName("Enjoying Vivid Tab?")).toBeDisplayed();

			await $("button=Not really").click();
			await expect(
				byAccessibleName("We'd Love Your Feedback!"),
			).toBeDisplayed();
			await $("button=Maybe Later").click();
			await expect(byAccessibleName("We'd Love Your Feedback!")).not.toExist();

			await openSettingsDialog();
			await openSettingsTab("Support");
			await $(
				'//h3[normalize-space(.)="Leave a Review"]/ancestor::button',
			).click();
			await $("button=Yes, It's awesome!").click();
			await expect(byAccessibleName("Thank You!")).toBeDisplayed();
			await $("button=Maybe Later").click();
			await expect(byAccessibleName("Thank You!")).not.toExist();
		});
	});
};
