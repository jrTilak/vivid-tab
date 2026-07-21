import { describe, expect, test } from "@test/jest";
import {
	getNextTheme,
	isEditableThemeShortcutTarget,
	isTheme,
	resolveTheme,
} from "./theme";

describe("theme logic", () => {
	test.each(["dark", "light", "system"])("accepts theme %s", (theme) => {
		expect(isTheme(theme)).toBe(true);
	});

	test.each([
		null,
		undefined,
		"",
		"auto",
		1,
		{},
	])("rejects invalid theme %j", (theme) => {
		expect(isTheme(theme)).toBe(false);
	});

	test("resolves explicit and system themes", () => {
		expect(resolveTheme("dark", false)).toBe("dark");
		expect(resolveTheme("light", true)).toBe("light");
		expect(resolveTheme("system", true)).toBe("dark");
		expect(resolveTheme("system", false)).toBe("light");
	});

	test("toggles from the effective theme", () => {
		expect(getNextTheme("dark", false)).toBe("light");
		expect(getNextTheme("light", true)).toBe("dark");
		expect(getNextTheme("system", true)).toBe("light");
		expect(getNextTheme("system", false)).toBe("dark");
	});

	test("recognizes editable elements and their descendants", () => {
		const input = document.createElement("input");
		const textarea = document.createElement("textarea");
		const select = document.createElement("select");
		const editable = document.createElement("div");
		const editableChild = document.createElement("span");
		const directlyEditable = document.createElement("div");
		Object.defineProperty(directlyEditable, "isContentEditable", {
			value: true,
		});
		editable.setAttribute("contenteditable", "true");
		editable.append(editableChild);

		expect(isEditableThemeShortcutTarget(input)).toBe(true);
		expect(isEditableThemeShortcutTarget(textarea)).toBe(true);
		expect(isEditableThemeShortcutTarget(select)).toBe(true);
		expect(isEditableThemeShortcutTarget(directlyEditable)).toBe(true);
		expect(isEditableThemeShortcutTarget(editable)).toBe(true);
		expect(isEditableThemeShortcutTarget(editableChild)).toBe(true);
	});

	test("rejects ordinary and non-element event targets", () => {
		expect(isEditableThemeShortcutTarget(document.createElement("div"))).toBe(
			false,
		);
		expect(isEditableThemeShortcutTarget(document)).toBe(false);
		expect(isEditableThemeShortcutTarget(null)).toBe(false);
	});
});
