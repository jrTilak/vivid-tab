import {
	afterEach,
	describe,
	expect,
	jest,
	mock,
	spyOn,
	test,
} from "@test/jest";
import { createDefaultSettings } from "@/lib/settings-storage";
import {
	exportSettingsFile,
	InvalidSettingsFileError,
	parseSettingsFile,
	SettingsFileReadError,
	selectSettingsFile,
} from "./settings-file";

const originalFileReader = globalThis.FileReader;
const createObjectUrlDescriptor = Object.getOwnPropertyDescriptor(
	URL,
	"createObjectURL",
);
const revokeObjectUrlDescriptor = Object.getOwnPropertyDescriptor(
	URL,
	"revokeObjectURL",
);

afterEach(() => {
	globalThis.FileReader = originalFileReader;
	jest.useRealTimers();
	mock.restore();

	if (createObjectUrlDescriptor) {
		Object.defineProperty(URL, "createObjectURL", createObjectUrlDescriptor);
	} else {
		Reflect.deleteProperty(URL, "createObjectURL");
	}

	if (revokeObjectUrlDescriptor) {
		Object.defineProperty(URL, "revokeObjectURL", revokeObjectUrlDescriptor);
	} else {
		Reflect.deleteProperty(URL, "revokeObjectURL");
	}
});

describe("parseSettingsFile", () => {
	test("unwraps a settings backup", () => {
		expect(parseSettingsFile('{"settings":{"version":1}}')).toEqual({
			version: 1,
		});
	});

	test("keeps a legacy bare-settings payload", () => {
		expect(parseSettingsFile('{"version":1}')).toEqual({ version: 1 });
	});

	test("classifies malformed JSON as an invalid settings file", () => {
		expect(() => parseSettingsFile("{")).toThrow(InvalidSettingsFileError);
	});

	test.each([
		["null", null],
		["false", false],
		["0", 0],
		['{"settings":null}', null],
		['{"settings":false}', false],
	])("preserves valid JSON payloads from %s", (source, expected) => {
		expect(parseSettingsFile(source)).toEqual(expected);
	});
});

describe("selectSettingsFile", () => {
	test("resolves undefined when the picker is cancelled", async () => {
		spyOn(HTMLInputElement.prototype, "click").mockImplementation(function () {
			this.dispatchEvent(new Event("cancel"));
		});

		await expect(selectSettingsFile()).resolves.toBeUndefined();
	});

	test("resolves undefined when change has no selected file", async () => {
		spyOn(HTMLInputElement.prototype, "click").mockImplementation(function () {
			this.dispatchEvent(new Event("change"));
		});

		await expect(selectSettingsFile()).resolves.toBeUndefined();
	});

	test("reads and parses the selected JSON file", async () => {
		const file = new File(['{"settings":{"version":1}}'], "settings.json", {
			type: "application/json",
		});
		spyOn(HTMLInputElement.prototype, "click").mockImplementation(function () {
			Object.defineProperty(this, "files", {
				configurable: true,
				value: [file],
			});
			this.dispatchEvent(new Event("change"));
		});

		await expect(selectSettingsFile()).resolves.toEqual({ version: 1 });
	});

	test("rejects malformed selected JSON", async () => {
		const file = new File(["{"], "settings.json", {
			type: "application/json",
		});
		spyOn(HTMLInputElement.prototype, "click").mockImplementation(function () {
			Object.defineProperty(this, "files", {
				configurable: true,
				value: [file],
			});
			this.dispatchEvent(new Event("change"));
		});

		await expect(selectSettingsFile()).rejects.toBeInstanceOf(
			InvalidSettingsFileError,
		);
	});

	test("classifies FileReader failures separately from invalid JSON", async () => {
		class FailingFileReader {
			error = new DOMException("read failed");
			onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;
			onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
			result: string | ArrayBuffer | null = null;

			readAsText() {
				this.onerror?.(new ProgressEvent("error") as ProgressEvent<FileReader>);
			}
		}
		globalThis.FileReader = FailingFileReader as unknown as typeof FileReader;
		const file = new File(["{}"], "settings.json");
		spyOn(HTMLInputElement.prototype, "click").mockImplementation(function () {
			Object.defineProperty(this, "files", {
				configurable: true,
				value: [file],
			});
			this.dispatchEvent(new Event("change"));
		});

		await expect(selectSettingsFile()).rejects.toBeInstanceOf(
			SettingsFileReadError,
		);
	});
});

describe("exportSettingsFile", () => {
	const installUrlMocks = () => {
		let exportedBlob: Blob | undefined;
		const createObjectURL = mock((blob: Blob) => {
			exportedBlob = blob;
			return "blob:vivid-tab-settings";
		});
		const revokeObjectURL = mock(() => undefined);
		Object.defineProperty(URL, "createObjectURL", {
			configurable: true,
			value: createObjectURL,
		});
		Object.defineProperty(URL, "revokeObjectURL", {
			configurable: true,
			value: revokeObjectURL,
		});

		return { createObjectURL, getBlob: () => exportedBlob, revokeObjectURL };
	};

	test("downloads a dated canonical backup and releases its URL", async () => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date("2026-07-21T12:00:00Z"));
		const urlMocks = installUrlMocks();
		let clickedAnchor: HTMLAnchorElement | undefined;
		spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function () {
			clickedAnchor = this;
		});
		const settings = createDefaultSettings();

		exportSettingsFile(settings);

		expect(clickedAnchor?.href).toBe("blob:vivid-tab-settings");
		expect(clickedAnchor?.download).toBe("vivid-tab-settings-2026-07-21.json");
		expect(urlMocks.createObjectURL).toHaveBeenCalledTimes(1);
		expect(urlMocks.revokeObjectURL).toHaveBeenCalledWith(
			"blob:vivid-tab-settings",
		);
		const exportedBlob = urlMocks.getBlob();
		expect(exportedBlob).toBeDefined();
		const exportedText = await new Promise<string>((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(String(reader.result));
			reader.onerror = () => reject(reader.error);
			reader.readAsText(exportedBlob as Blob);
		});
		expect(JSON.parse(exportedText)).toEqual({
			settings,
		});
	});

	test("releases the object URL even when the download click fails", () => {
		const urlMocks = installUrlMocks();
		spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {
			throw new Error("download blocked");
		});

		expect(() => exportSettingsFile(createDefaultSettings())).toThrow(
			"download blocked",
		);
		expect(urlMocks.revokeObjectURL).toHaveBeenCalledWith(
			"blob:vivid-tab-settings",
		);
	});
});
