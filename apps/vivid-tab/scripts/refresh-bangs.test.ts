import {
	mkdir,
	mkdtemp,
	readdir,
	readFile,
	rm,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, mock, test } from "@test/jest";
import {
	buildBangCatalog,
	getSourceSha256,
	LOCAL_ICON_BY_BANG_TRIGGER,
	MAX_GENERATED_CATALOG_BYTES,
	parseSourceBangs,
	refreshBangCatalog,
	renderBangCatalog,
	SELECTED_BANG_TRIGGERS,
	SOURCE_FETCH_TIMEOUT_MS,
	type SourceBang,
	writeFileAtomically,
} from "./refresh-bangs";

const makeBang = (
	trigger: string,
	overrides: Partial<SourceBang> = {},
): SourceBang => ({
	d: `${trigger.replaceAll(".", "-")}.example.com`,
	s: `Search ${trigger}`,
	t: trigger,
	u: `https://${trigger.replaceAll(".", "-")}.example.com/search?q={{{s}}}`,
	...overrides,
});

const makeCompleteSource = () =>
	SELECTED_BANG_TRIGGERS.map((trigger) => makeBang(trigger));

describe("bang source validation", () => {
	test("accepts the upstream shape without retaining mutable arrays", () => {
		const aliases = ["video"];
		const format = ["url_encode_placeholder"] as const;
		const source = [
			makeBang("yt", {
				ad: null as unknown as undefined,
				fmt: [...format],
				ts: aliases,
				x: "" as unknown as undefined,
			}),
		];
		const parsed = parseSourceBangs(source);

		expect(parsed).toEqual([
			{
				...makeBang("yt"),
				ad: undefined,
				fmt: [...format],
				ts: aliases,
				x: undefined,
			},
		]);
		expect(parsed).not.toBe(source);
		expect(parsed[0]?.fmt).not.toBe(format);
		expect(parsed[0]?.ts).not.toBe(aliases);
	});

	test.each([
		[null, "must return an array"],
		[[null], "must be an object"],
		[[{ ...makeBang("a"), d: "" }], "invalid d"],
		[[{ ...makeBang("a"), s: 1 }], "invalid s"],
		[[{ ...makeBang("a"), t: " " }], "invalid t"],
		[[{ ...makeBang("a"), u: null }], "invalid u"],
		[[{ ...makeBang("a"), ad: 1 }], "invalid ad"],
		[[{ ...makeBang("a"), x: {} }], "invalid x"],
		[[{ ...makeBang("a"), ts: "alias" }], "invalid ts"],
		[[{ ...makeBang("a"), ts: [""] }], "invalid ts"],
		[[{ ...makeBang("a"), fmt: "flag" }], "invalid fmt"],
		[[{ ...makeBang("a"), fmt: ["future_flag"] }], "unsupported fmt"],
	])("rejects invalid complete responses %#", (source, message) => {
		expect(() => parseSourceBangs(source)).toThrow(message);
	});

	test("rejects duplicate canonical triggers after normalization", () => {
		expect(() => parseSourceBangs([makeBang("yt"), makeBang(" YT ")])).toThrow(
			"duplicate canonical trigger: yt",
		);
	});
});

describe("catalog selection", () => {
	test("is deterministic, normalizes data, and retains safe aliases", () => {
		const aliases = ["YouTube", "youtube", "ютуб", "yt-video"];
		const format = ["url_encode_placeholder"] as const;
		const selected = makeBang("yt", {
			d: " WWW.YouTube.COM ",
			fmt: [...format],
			s: "  YouTube  Search ",
			t: "YT",
			ts: aliases,
		});
		const forward = buildBangCatalog([selected, makeBang("g")], ["yt", "g"]);
		const reversed = buildBangCatalog([makeBang("g"), selected], ["yt", "g"]);

		expect(reversed).toEqual(forward);
		expect(forward[0]).toEqual({
			domain: "www.youtube.com",
			format: ["url_encode_placeholder"],
			icon: LOCAL_ICON_BY_BANG_TRIGGER.yt,
			name: "YouTube Search",
			snapDomain: undefined,
			template: "https://yt.example.com/search?q={{{s}}}",
			triggers: ["yt", "youtube", "yt-video"],
		});
		expect(forward[0]?.format).not.toBe(format);
		expect(forward[0]?.triggers).not.toBe(aliases);
	});

	test("keeps a validated snap domain", () => {
		expect(
			buildBangCatalog(
				[makeBang("hn", { ad: " News.YCombinator.com " })],
				["hn"],
			)[0]?.snapDomain,
		).toBe("news.ycombinator.com");
	});

	test.each([
		[[], ["yt"], "missing upstream"],
		[[makeBang("yt")], ["yt", "YT"], "unique and valid"],
		[[makeBang("yt")], ["bad trigger"], "unique and valid"],
		[
			[makeBang("yt"), makeBang(" YT ")],
			["yt"],
			"Duplicate upstream bang trigger",
		],
	])("rejects invalid source or selection configuration %#", (source, selected, message) => {
		expect(() => buildBangCatalog(source, selected)).toThrow(message);
	});

	test.each([
		[{ x: "(.*)" }, "unsupported regex parsing"],
		[{ u: "https://example.com/search" }, "no search placeholder"],
		[{ u: "/search?q={{{s}}}" }, "invalid URL template"],
		[{ u: "javascript:alert('{{{s}}}')" }, "unsafe URL protocol"],
		[{ ad: "example.com/path" }, "invalid snap domain"],
	])("rejects an unsafe selected bang %#", (overrides, message) => {
		expect(() => buildBangCatalog([makeBang("yt", overrides)], ["yt"])).toThrow(
			message,
		);
	});

	test("rejects aliases shared by two selected bangs", () => {
		expect(() =>
			buildBangCatalog(
				[
					makeBang("first", { ts: ["shared"] }),
					makeBang("second", { ts: ["shared"] }),
				],
				["first", "second"],
			),
		).toThrow("share trigger: shared");
	});
});

describe("catalog generation", () => {
	test("renders an attributed generated module", () => {
		const sourceSha256 = "a".repeat(64);
		const output = renderBangCatalog(
			buildBangCatalog([makeBang("yt")], ["yt"]),
			sourceSha256,
		);

		expect(output).toContain("GENERATED FILE — DO NOT EDIT");
		expect(output).toContain(
			"Kagi Bangs (MIT, Copyright (c) 2024 Kagi Search)",
		);
		expect(output).toContain("https://github.com/kagisearch/bangs");
		expect(output).toContain(`Source SHA-256: ${sourceSha256}`);
		expect(output).toContain("export const BANGS =");
	});

	test("computes SHA-256 from the exact downloaded bytes", () => {
		expect(getSourceSha256(new TextEncoder().encode("abc"))).toBe(
			"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
		);
	});

	test("fetches, validates, renders, then writes the complete catalog", async () => {
		const sourceText = JSON.stringify(makeCompleteSource());
		const sourceSha256 = getSourceSha256(new TextEncoder().encode(sourceText));
		const timeoutSignal = new AbortController().signal;
		const createTimeoutSignal = mock(() => timeoutSignal);
		const fetchImplementation = mock(
			async () => new Response(sourceText, { status: 200 }),
		) as unknown as typeof fetch;
		const writeGeneratedFile = mock(async () => undefined);

		const catalog = await refreshBangCatalog({
			createTimeoutSignal,
			fetchImplementation,
			outputPath: "/tmp/catalog.generated.ts",
			writeGeneratedFile,
		});

		expect(createTimeoutSignal).toHaveBeenCalledWith(SOURCE_FETCH_TIMEOUT_MS);
		expect(fetchImplementation).toHaveBeenCalledWith(expect.any(String), {
			signal: timeoutSignal,
		});
		expect(catalog).toHaveLength(SELECTED_BANG_TRIGGERS.length);
		expect(writeGeneratedFile).toHaveBeenCalledWith(
			"/tmp/catalog.generated.ts",
			expect.stringContaining(`Source SHA-256: ${sourceSha256}`),
		);
	});

	test("does not write a generated module over the UTF-8 size cap", async () => {
		const source = makeCompleteSource().map((bang) => ({
			...bang,
			s: "A".repeat(MAX_GENERATED_CATALOG_BYTES),
		}));
		const writeGeneratedFile = mock(async () => undefined);

		await expect(
			refreshBangCatalog({
				fetchImplementation: mock(
					async () => new Response(JSON.stringify(source)),
				) as unknown as typeof fetch,
				writeGeneratedFile,
			}),
		).rejects.toThrow(`exceeds the ${MAX_GENERATED_CATALOG_BYTES}-byte limit`);
		expect(writeGeneratedFile).not.toHaveBeenCalled();
	});

	test("never writes failed, invalid, or incomplete upstream data", async () => {
		const writeGeneratedFile = mock(async () => undefined);

		await expect(
			refreshBangCatalog({
				fetchImplementation: mock(
					async () =>
						new Response("unavailable", {
							status: 503,
							statusText: "Offline",
						}),
				) as unknown as typeof fetch,
				writeGeneratedFile,
			}),
		).rejects.toThrow("503 Offline");

		await expect(
			refreshBangCatalog({
				fetchImplementation: mock(
					async () => new Response("{", { status: 200 }),
				) as unknown as typeof fetch,
				writeGeneratedFile,
			}),
		).rejects.toThrow();

		await expect(
			refreshBangCatalog({
				fetchImplementation: mock(
					async () => new Response(JSON.stringify([makeBang("yt")])),
				) as unknown as typeof fetch,
				writeGeneratedFile,
			}),
		).rejects.toThrow("missing upstream");

		expect(writeGeneratedFile).not.toHaveBeenCalled();
	});

	test("propagates an atomic writer failure", async () => {
		const writeGeneratedFile = mock(async () => {
			throw new Error("disk full");
		});

		await expect(
			refreshBangCatalog({
				fetchImplementation: mock(
					async () => new Response(JSON.stringify(makeCompleteSource())),
				) as unknown as typeof fetch,
				writeGeneratedFile,
			}),
		).rejects.toThrow("disk full");
		expect(writeGeneratedFile).toHaveBeenCalledTimes(1);
	});
});

describe("atomic generated-file writes", () => {
	test("replaces the destination and leaves no temporary file", async () => {
		const root = await mkdtemp(join(tmpdir(), "vivid-tab-bangs-"));
		const target = join(root, "nested", "catalog.generated.ts");

		try {
			await mkdir(dirname(target), { recursive: true });
			await writeFile(target, "old", "utf8");
			await writeFileAtomically(target, "new");

			expect(await readFile(target, "utf8")).toBe("new");
			expect(await readdir(dirname(target))).toEqual(["catalog.generated.ts"]);
		} finally {
			await rm(root, { force: true, recursive: true });
		}
	});

	test("removes its temporary file when the final rename fails", async () => {
		const root = await mkdtemp(join(tmpdir(), "vivid-tab-bangs-"));
		const target = join(root, "catalog.generated.ts");

		try {
			await mkdir(target);
			await expect(writeFileAtomically(target, "new")).rejects.toThrow();
			expect(await readdir(root)).toEqual(["catalog.generated.ts"]);
		} finally {
			await rm(root, { force: true, recursive: true });
		}
	});
});
