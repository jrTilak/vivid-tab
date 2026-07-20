import { describe, expect, test } from "bun:test";
import { deepMerge } from "@/lib/deep-merge";

describe("deepMerge", () => {
	test("recursively fills missing fields without mutating either input", () => {
		const defaults = {
			general: { enabled: true, mode: "grid" },
			items: ["default"],
		};
		const persisted = { general: { mode: "list" } };

		const result = deepMerge(defaults, persisted) as typeof defaults;

		expect(result).toEqual({
			general: { enabled: true, mode: "list" },
			items: ["default"],
		});
		expect(defaults).toEqual({
			general: { enabled: true, mode: "grid" },
			items: ["default"],
		});
		expect(persisted).toEqual({ general: { mode: "list" } });
		expect(result.general).not.toBe(defaults.general);
		expect(result.items).not.toBe(defaults.items);
	});

	test("replaces arrays, null, and invalid primitive types atomically", () => {
		const defaults = {
			items: ["one", "two"],
			selection: "one",
			nested: { enabled: true },
		};

		expect(
			deepMerge(defaults, {
				items: [],
				selection: null,
				nested: false,
			}),
		).toEqual({ items: [], selection: null, nested: false });
	});

	test("supports path-specific object replacement", () => {
		const result = deepMerge(
			{ widgets: { layout: { 0: "searchbar", 1: "clock" } } },
			{ widgets: { layout: { 0: "searchbar" } } },
			{
				shouldReplace: (path) => path.join(".") === "widgets.layout",
			},
		);

		expect(result).toEqual({
			widgets: { layout: { 0: "searchbar" } },
		});
	});

	test("ignores prototype-pollution keys in imported objects", () => {
		const persisted = JSON.parse(
			'{"safe":2,"__proto__":{"polluted":true}}',
		) as unknown;
		const result = deepMerge({ safe: 1 }, persisted) as Record<string, unknown>;

		expect(result).toEqual({ safe: 2 });
		expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
	});
});
