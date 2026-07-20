import type { Settings } from "@/zod/settings";

/** Signals that a readable file did not contain valid JSON. */
export class InvalidSettingsFileError extends Error {
	constructor(cause: unknown) {
		super("The selected settings file is not valid JSON", { cause });
		this.name = "InvalidSettingsFileError";
	}
}

/** Signals a file-system read failure without treating the settings as invalid. */
export class SettingsFileReadError extends Error {
	constructor(cause?: unknown) {
		super("The selected settings file could not be read", { cause });
		this.name = "SettingsFileReadError";
	}
}

const readFileAsText = (file: File): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () =>
			typeof reader.result === "string"
				? resolve(reader.result)
				: reject(new SettingsFileReadError());
		reader.onerror = () => reject(new SettingsFileReadError(reader.error));
		reader.readAsText(file);
	});

/** Parses both current backup envelopes and legacy bare-settings files. */
export const parseSettingsFile = (source: string): unknown => {
	let parsed: unknown;

	try {
		parsed = JSON.parse(source) as unknown;
	} catch (error) {
		throw new InvalidSettingsFileError(error);
	}

	if (parsed && typeof parsed === "object" && "settings" in parsed) {
		return (parsed as { settings: unknown }).settings;
	}

	return parsed;
};

/** Opens the file picker and returns the imported settings payload. */
export const selectSettingsFile = (): Promise<unknown | undefined> =>
	new Promise((resolve, reject) => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = ".json,application/json";
		input.addEventListener("cancel", () => resolve(undefined), { once: true });

		input.onchange = async () => {
			const file = input.files?.[0];
			if (!file) {
				resolve(undefined);
				return;
			}

			try {
				resolve(parseSettingsFile(await readFileAsText(file)));
			} catch (error) {
				reject(error);
			}
		};

		input.click();
	});

/** Downloads a canonical JSON backup and always releases the object URL. */
export const exportSettingsFile = (settings: Settings) => {
	const json = JSON.stringify({ settings }, null, 2);
	const url = URL.createObjectURL(
		new Blob([json], { type: "application/json" }),
	);
	const anchor = document.createElement("a");

	anchor.href = url;
	anchor.download = `vivid-tab-settings-${new Date().toISOString().slice(0, 10)}.json`;
	anchor.click();
	URL.revokeObjectURL(url);
};
