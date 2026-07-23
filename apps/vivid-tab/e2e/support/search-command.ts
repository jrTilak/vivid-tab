import { $, browser } from "@wdio/globals";
import {
	BACKGROUND_ACTIONS,
	EXTENSION_COMMANDS,
} from "../../src/constants/background-actions";

type BrowserCommand = {
	name?: string;
	shortcut?: string;
};

type CommandResult<Value> =
	| { error: string; ok: false }
	| { ok: true; value: Value };

const unwrapCommandResult = <Value>(result: CommandResult<Value>) => {
	if ("error" in result) throw new Error(result.error);

	return result.value;
};

/** Reads the browser-assigned shortcut from the packaged extension manifest. */
export const readConfiguredSearchCommand = async () => {
	const result = await browser.executeAsync<
		CommandResult<BrowserCommand | null>,
		[string]
	>((commandName, done) => {
		chrome.commands.getAll((commands) => {
			const error = chrome.runtime.lastError;
			const command = commands.find((entry) => entry.name === commandName);
			done(
				error
					? { error: error.message, ok: false }
					: {
							ok: true,
							value: command
								? { name: command.name, shortcut: command.shortcut }
								: null,
						},
			);
		});
	}, EXTENSION_COMMANDS.TOGGLE_VIVID_SEARCH);

	return unwrapCommandResult(result);
};

/**
 * Replays the typed message emitted by the background command for this tab.
 *
 * WebDriver key actions are renderer-scoped and do not activate browser-owned
 * extension shortcuts. The manifest assignment is asserted separately, while
 * unit tests cover the command listener that emits this exact handoff.
 */
export const dispatchSearchToggleToExtensionTab = async () => {
	const targetUrl = await browser.getUrl();
	const tabResult = await browser.executeAsync<CommandResult<number>, []>(
		(done) => {
			chrome.tabs.getCurrent((tab) => {
				const error = chrome.runtime.lastError;
				done(
					error
						? { error: error.message, ok: false }
						: typeof tab?.id === "number"
							? { ok: true, value: tab.id }
							: { error: "The active extension tab has no ID", ok: false },
				);
			});
		},
	);
	const targetTabId = unwrapCommandResult(tabResult);
	const senderFrameId = "vivid-e2e-command-sender";
	await browser.executeAsync(
		(frameId, frameUrl, done) => {
			const frame = document.createElement("iframe");
			frame.id = frameId;
			frame.src = frameUrl;
			frame.style.position = "fixed";
			frame.style.inset = "-1px auto auto -1px";
			frame.style.width = "1px";
			frame.style.height = "1px";
			frame.addEventListener("load", () => done(true), { once: true });
			document.body.append(frame);
		},
		senderFrameId,
		targetUrl,
	);

	const senderFrame = $(`#${senderFrameId}`);
	await browser.switchFrame(senderFrame);
	try {
		const sendResult = await browser.executeAsync<
			CommandResult<true>,
			[string, number]
		>(
			(action, targetTabId, done) => {
				chrome.runtime.sendMessage({ action, targetTabId }, () => {
					const error = chrome.runtime.lastError;
					done(
						error && !error.message.includes("before a response was received")
							? { error: error.message, ok: false }
							: { ok: true, value: true },
					);
				});
			},
			BACKGROUND_ACTIONS.TOGGLE_VIVID_SEARCH,
			targetTabId,
		);
		unwrapCommandResult(sendResult);
	} finally {
		await browser.switchFrame(null);
		await browser.execute((frameId) => {
			document.getElementById(frameId)?.remove();
		}, senderFrameId);
	}

	return targetTabId;
};
