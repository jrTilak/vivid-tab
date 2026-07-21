import { describe, expect, test } from "@test";
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
		const persistedLayout = { 0: "searchbar" };
		const result = deepMerge(
			{ widgets: { layout: { 0: "searchbar", 1: "clock" } } },
			{ widgets: { layout: persistedLayout } },
			{
				shouldReplace: (path) => path.join(".") === "widgets.layout",
			},
		);

		expect(result).toEqual({
			widgets: { layout: { 0: "searchbar" } },
		});
		expect((result as { widgets: { layout: object } }).widgets.layout).not.toBe(
			persistedLayout,
		);
	});

	test("ignores prototype-pollution keys in imported objects", () => {
		const persisted = JSON.parse(
			'{"safe":2,"__proto__":{"polluted":true}}',
		) as unknown;
		const result = deepMerge({ safe: 1 }, persisted) as Record<string, unknown>;

		expect(result).toEqual({ safe: 2 });
		expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
	});

	test("ignores every prototype-pollution key at nested levels", () => {
		const persisted = JSON.parse(
			'{"nested":{"constructor":{"bad":true},"prototype":{"bad":true},"safe":2}}',
		) as unknown;

		expect(deepMerge({ nested: { safe: 1 } }, persisted)).toEqual({
			nested: { safe: 2 },
		});
	});

	test("omits unsafe keys while cloning defaults and atomic replacements", () => {
		const defaults = JSON.parse(
			'{"safe":1,"__proto__":{"polluted":true}}',
		) as unknown;
		const replacement = JSON.parse(
			'{"safe":2,"constructor":{"polluted":true},"prototype":{"polluted":true}}',
		) as unknown;

		expect(deepMerge(defaults, undefined)).toEqual({ safe: 1 });
		expect(
			deepMerge(defaults, replacement, { shouldReplace: () => true }),
		).toEqual({ safe: 2 });
		expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
	});

	test("recursively merges objects with a null prototype", () => {
		const defaultNested = Object.assign(
			Object.create(null) as Record<string, unknown>,
			{
				enabled: true,
				label: "default",
			},
		);
		const defaults = Object.assign(
			Object.create(null) as Record<string, unknown>,
			{
				nested: defaultNested,
			},
		);
		const persisted = Object.assign(
			Object.create(null) as Record<string, unknown>,
			{
				nested: Object.assign(Object.create(null) as Record<string, unknown>, {
					label: "saved",
				}),
			},
		);

		const result = deepMerge(defaults, persisted) as {
			nested: { enabled: boolean; label: string };
		};

		expect(result).toEqual({ nested: { enabled: true, label: "saved" } });
		expect(result.nested).not.toBe(defaultNested);
	});

	test("clones a nested default when persisted input explicitly uses undefined", () => {
		const defaultValue = { enabled: true };
		const defaults = { nested: { value: defaultValue } };
		const result = deepMerge(defaults, {
			nested: { value: undefined },
		}) as typeof defaults;

		expect(result).toEqual(defaults);
		expect(result.nested).not.toBe(defaults.nested);
		expect(result.nested.value).not.toBe(defaultValue);
	});

	test("deep-clones defaults when persisted storage is missing", () => {
		const defaults = {
			items: [{ enabled: true }],
			nested: { value: 1 },
		};
		const result = deepMerge(defaults, undefined) as typeof defaults;

		expect(result).toEqual(defaults);
		expect(result).not.toBe(defaults);
		expect(result.items).not.toBe(defaults.items);
		expect(result.items[0]).not.toBe(defaults.items[0]);
		expect(result.nested).not.toBe(defaults.nested);
	});
});
