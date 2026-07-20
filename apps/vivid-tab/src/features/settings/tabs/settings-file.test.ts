import { describe, expect, test } from "bun:test";
import { InvalidSettingsFileError, parseSettingsFile } from "./settings-file";

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
});
