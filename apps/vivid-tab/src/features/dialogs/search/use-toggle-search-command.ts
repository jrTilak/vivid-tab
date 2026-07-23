import { useEffect } from "react";
import { isToggleVividSearchMessage } from "@/constants/background-actions";

/**
 * Toggles search only when the browser command targets this extension tab.
 *
 * Runtime messages are broadcast to extension views, so the active tab ID is
 * checked before notifying the controlled dialog. Messages received while the
 * tab lookup is pending are replayed by parity once the ID is known.
 */
export const useToggleSearchCommand = (onToggle: () => void) => {
	useEffect(() => {
		let disposed = false;
		let currentTabId: number | null | undefined;
		const pendingTargetTabIds: number[] = [];
		const handleMessage = (
			message: unknown,
			sender: chrome.runtime.MessageSender,
		) => {
			if (
				disposed ||
				sender.id !== chrome.runtime.id ||
				!isToggleVividSearchMessage(message)
			) {
				return;
			}

			if (currentTabId === undefined) {
				pendingTargetTabIds.push(message.targetTabId);
				return;
			}

			if (message.targetTabId === currentTabId) onToggle();
		};

		chrome.runtime.onMessage.addListener(handleMessage);

		try {
			void chrome.tabs.getCurrent().then(
				(tab) => {
					if (disposed) return;

					currentTabId = typeof tab?.id === "number" ? tab.id : null;
					if (
						currentTabId !== null &&
						pendingTargetTabIds.filter((tabId) => tabId === currentTabId)
							.length %
							2 ===
							1
					) {
						onToggle();
					}
					pendingTargetTabIds.length = 0;
				},
				() => {
					currentTabId = null;
					pendingTargetTabIds.length = 0;
				},
			);
		} catch {
			currentTabId = null;
		}

		return () => {
			disposed = true;
			pendingTargetTabIds.length = 0;
			chrome.runtime.onMessage.removeListener(handleMessage);
		};
	}, [onToggle]);
};
