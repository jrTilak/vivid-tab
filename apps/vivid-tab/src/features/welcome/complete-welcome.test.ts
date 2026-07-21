import { describe, expect, test } from "@test/jest";
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
		expect(openedTab).toBe(false);
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

		expect(persisted).toBe(false);
	});

	test("does not close the welcome tab when the browser reuses it", async () => {
		let closed = false;

		await runWelcomeCompletion({
			getWelcomeTab: async () => ({ id: 7 }),
			persistRootFolder: async () => true,
			openNewTab: async () => ({ id: 7 }),
			closeWelcomeTab: async () => {
				closed = true;
			},
		});

		expect(closed).toBe(false);
	});

	test("does not close a welcome tab without an ID", async () => {
		let closed = false;

		await runWelcomeCompletion({
			getWelcomeTab: async () => ({}),
			persistRootFolder: async () => true,
			openNewTab: async () => ({ id: 8 }),
			closeWelcomeTab: async () => {
				closed = true;
			},
		});

		expect(closed).toBe(false);
	});

	test("stops before persistence when folder resolution fails", async () => {
		const events: string[] = [];

		await expect(
			runWelcomeCompletion({
				getWelcomeTab: async () => {
					events.push("get-current");
					return { id: 1 };
				},
				resolveRootFolder: async () => {
					events.push("resolve-folder");
					throw new Error("folder lookup failed");
				},
				persistRootFolder: async () => {
					events.push("persist");
					return true;
				},
				openNewTab: async () => {
					events.push("open");
					return { id: 2 };
				},
				closeWelcomeTab: async () => {
					events.push("close");
				},
			}),
		).rejects.toThrow("folder lookup failed");
		expect(events).toEqual(["get-current", "resolve-folder"]);
	});

	test("does not close the welcome tab when opening its replacement fails", async () => {
		let closed = false;

		await expect(
			runWelcomeCompletion({
				getWelcomeTab: async () => ({ id: 1 }),
				resolveRootFolder: () => "folder",
				persistRootFolder: async () => true,
				openNewTab: async () => {
					throw new Error("tab creation failed");
				},
				closeWelcomeTab: async () => {
					closed = true;
				},
			}),
		).rejects.toThrow("tab creation failed");
		expect(closed).toBe(false);
	});

	test("propagates failures when closing the old welcome tab", async () => {
		await expect(
			runWelcomeCompletion({
				getWelcomeTab: async () => ({ id: 1 }),
				persistRootFolder: async () => true,
				openNewTab: async () => ({ id: 2 }),
				closeWelcomeTab: async () => {
					throw new Error("tab close failed");
				},
			}),
		).rejects.toThrow("tab close failed");
	});
});
