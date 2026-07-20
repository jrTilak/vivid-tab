import { describe, expect, test } from "bun:test";
import { runWelcomeCompletion } from "./complete-welcome";

describe("runWelcomeCompletion", () => {
	test("persists the folder before replacing the welcome tab", async () => {
		const events: string[] = [];

		await runWelcomeCompletion({
			getWelcomeTab: async () => {
				events.push("get-current");
				return { id: 0 };
			},
			resolveRootFolder: () => {
				events.push("resolve-folder");
				return "42";
			},
			persistRootFolder: async (folderId) => {
				events.push(`persist-${folderId}`);
				return true;
			},
			openNewTab: async () => {
				events.push("open-new-tab");
				return { id: 1 };
			},
			closeWelcomeTab: async (tabId) => {
				events.push(`close-${tabId}`);
			},
		});

		expect(events).toEqual([
			"get-current",
			"resolve-folder",
			"persist-42",
			"open-new-tab",
			"close-0",
		]);
	});

	test("does not open a tab when persistence fails", async () => {
		let openedTab = false;

		await expect(
			runWelcomeCompletion({
				getWelcomeTab: async () => ({ id: 2 }),
				resolveRootFolder: () => "42",
				persistRootFolder: async () => false,
				openNewTab: async () => {
					openedTab = true;
					return { id: 3 };
				},
				closeWelcomeTab: async () => undefined,
			}),
		).rejects.toThrow("was not saved");
		expect(openedTab).toBeFalse();
	});

	test("skips persistence when no folder is selected", async () => {
		let persisted = false;

		await runWelcomeCompletion({
			getWelcomeTab: async () => undefined,
			persistRootFolder: async () => {
				persisted = true;
				return true;
			},
			openNewTab: async () => ({ id: 3 }),
			closeWelcomeTab: async () => undefined,
		});

		expect(persisted).toBeFalse();
	});
});
