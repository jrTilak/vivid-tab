import { useEffect, useState } from "react";

/** Reads the shortcut currently assigned by the browser for one command. */
export const readCommandShortcut = (commandName: string) =>
	new Promise<string | null>((resolve) => {
		try {
			chrome.commands.getAll((commands) => {
				try {
					if (chrome.runtime.lastError) {
						resolve(null);
						return;
					}

					const shortcut = commands
						.find((command) => command.name === commandName)
						?.shortcut?.trim();

					resolve(shortcut || null);
				} catch {
					resolve(null);
				}
			});
		} catch {
			resolve(null);
		}
	});

/** Keeps UI copy aligned with the browser's active command assignment. */
export const useCommandShortcut = (commandName: string) => {
	const [shortcut, setShortcut] = useState<string | null>(null);

	useEffect(() => {
		let disposed = false;

		void readCommandShortcut(commandName).then((assignedShortcut) => {
			if (!disposed) setShortcut(assignedShortcut);
		});

		return () => {
			disposed = true;
		};
	}, [commandName]);

	return shortcut;
};
