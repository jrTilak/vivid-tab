import { afterEach, describe, expect, mock, test } from "@test/jest";
import { act, cleanup, renderHook } from "@testing-library/react";
import {
	readCommandShortcut,
	useCommandShortcut,
} from "./use-command-shortcut";

type GetAllCommands = (
	callback: (commands: chrome.commands.Command[]) => void,
) => void;

const originalChrome = globalThis.chrome;

const installChrome = (
	getAll: GetAllCommands,
	lastError?: chrome.runtime.LastError,
) => {
	globalThis.chrome = {
		commands: { getAll },
		runtime: { lastError },
	} as unknown as typeof chrome;
};

afterEach(() => {
	cleanup();
	globalThis.chrome = originalChrome;
});

describe("readCommandShortcut", () => {
	test("returns the browser-assigned shortcut", async () => {
		installChrome((callback) =>
			callback([
				{ name: "another-command", shortcut: "Ctrl+K" },
				{ name: "search", shortcut: "  Ctrl+Shift+Space  " },
			]),
		);

		await expect(readCommandShortcut("search")).resolves.toBe(
			"Ctrl+Shift+Space",
		);
	});

	test.each([
		["missing command", [{ name: "other", shortcut: "Ctrl+K" }]],
		["empty assignment", [{ name: "search", shortcut: "   " }]],
	] as const)("returns Unassigned for a %s", async (_label, commands) => {
		installChrome((callback) =>
			callback(commands as unknown as chrome.commands.Command[]),
		);

		await expect(readCommandShortcut("search")).resolves.toBeNull();
	});

	test("returns Unassigned when the browser reports an API error", async () => {
		installChrome((callback) => callback([]), {
			message: "commands unavailable",
		});

		await expect(readCommandShortcut("search")).resolves.toBeNull();
	});

	test("returns Unassigned when command results are unreadable", async () => {
		installChrome((callback) =>
			callback(null as unknown as chrome.commands.Command[]),
		);

		await expect(readCommandShortcut("search")).resolves.toBeNull();
	});

	test("returns Unassigned when command lookup throws", async () => {
		installChrome(() => {
			throw new Error("commands unavailable");
		});

		await expect(readCommandShortcut("search")).resolves.toBeNull();
	});
});

describe("useCommandShortcut", () => {
	test("publishes the assigned shortcut and refreshes for a new command", async () => {
		const getAll = mock(
			(callback: (commands: chrome.commands.Command[]) => void) =>
				callback([
					{ name: "search", shortcut: "Ctrl+Shift+Space" },
					{ name: "alternate", shortcut: "Alt+K" },
				]),
		);
		installChrome(getAll);
		const { rerender, result } = renderHook(
			({ commandName }) => useCommandShortcut(commandName),
			{ initialProps: { commandName: "search" } },
		);

		expect(result.current).toBeNull();
		await act(async () => Promise.resolve());
		expect(result.current).toBe("Ctrl+Shift+Space");

		rerender({ commandName: "alternate" });
		await act(async () => Promise.resolve());
		expect(result.current).toBe("Alt+K");
		expect(getAll).toHaveBeenCalledTimes(2);
	});

	test("ignores a pending result after unmount", async () => {
		let resolveCommands: (commands: chrome.commands.Command[]) => void = () =>
			undefined;
		installChrome((callback) => {
			resolveCommands = callback;
		});
		const { result, unmount } = renderHook(() => useCommandShortcut("search"));

		expect(result.current).toBeNull();
		unmount();
		await act(async () => {
			resolveCommands([{ name: "search", shortcut: "Ctrl+Shift+Space" }]);
			await Promise.resolve();
		});
		expect(result.current).toBeNull();
	});
});
