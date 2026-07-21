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
	buildQuoteCatalog,
	CATALOG_CATEGORIES,
	getDefaultCatalogSeed,
	getSourceSha256,
	MAX_CONTENT_LENGTH,
	MAX_GENERATED_CATALOG_BYTES,
	MAX_QUOTES,
	MAX_QUOTES_PER_CATEGORY,
	parseSourceQuotes,
	refreshQuoteCatalog,
	renderQuoteCatalog,
	resolveCatalogSeed,
	SOURCE_FETCH_TIMEOUT_MS,
	type SourceQuote,
	writeFileAtomically,
} from "./refresh-quotes";

const makeQuote = (
	id: string,
	tags: string[],
	content = `Quote ${id}`,
): SourceQuote => ({
	_id: id,
	author: `Author ${id}`,
	content,
	tags,
});

const makeCompleteSource = (quotesPerCategory = 8) =>
	CATALOG_CATEGORIES.flatMap(({ name, slug }) =>
		Array.from({ length: quotesPerCategory }, (_, index) =>
			makeQuote(`${slug}-${index}`, [name], `${name} quote ${index}`),
		),
	);

describe("quote source validation", () => {
	test("accepts the required upstream shape without mutating it", () => {
		const tags = ["Wisdom"];
		const source = [{ _id: "one", author: "Author", content: "Content", tags }];
		const parsed = parseSourceQuotes(source);

		expect(parsed).toEqual(source);
		expect(parsed).not.toBe(source);
		expect(parsed[0]?.tags).not.toBe(tags);
	});

	test.each([
		[null, "must return an array"],
		[[null], "must be an object"],
		[[{ _id: "", author: "A", content: "C", tags: [] }], "invalid _id"],
		[[{ _id: "1", author: "", content: "C", tags: [] }], "invalid author"],
		[[{ _id: "1", author: "A", content: "", tags: [] }], "invalid content"],
		[[{ _id: "1", author: "A", content: "C", tags: "Wisdom" }], "invalid tags"],
		[[{ _id: "1", author: "A", content: "C", tags: [""] }], "invalid tags"],
	])("rejects an invalid complete response %#", (source, message) => {
		expect(() => parseSourceQuotes(source)).toThrow(message);
	});

	test("rejects duplicate IDs after whitespace normalization", () => {
		expect(() =>
			parseSourceQuotes([
				makeQuote("duplicate", ["Wisdom"]),
				makeQuote("  duplicate  ", ["Life"]),
			]),
		).toThrow("duplicate normalized _id: duplicate");
	});
});

describe("catalog selection", () => {
	test("normalizes values, merges duplicate categories, and filters long content", () => {
		const catalog = buildQuoteCatalog(
			[
				makeQuote("one", ["Wisdom"], "  A   useful   thought  "),
				makeQuote("two", ["Life"], "a useful thought"),
				makeQuote("long", ["Wisdom"], "x".repeat(81)),
				makeQuote("other", ["Famous Quotes"], "Not selected"),
			],
			{ seed: "fixed" },
		);

		expect(catalog.quotes).toEqual([
			{
				_id: "one",
				author: "Author one",
				categories: ["life", "wisdom"],
				content: "A useful thought",
			},
		]);
	});

	test("is deterministic for a seed and independent of source ordering", () => {
		const source = makeCompleteSource(12);
		const forward = buildQuoteCatalog(source, { seed: "same-seed" });
		const reversed = buildQuoteCatalog([...source].reverse(), {
			seed: "same-seed",
		});

		expect(reversed).toEqual(forward);
		expect(
			buildQuoteCatalog(source, { seed: "another-seed" }).quotes,
		).not.toEqual(forward.quotes);
	});

	test("caps total size, content length, and every category", () => {
		const catalog = buildQuoteCatalog(makeCompleteSource(10), {
			seed: "limits",
		});

		expect(catalog.quotes.length).toBeLessThanOrEqual(MAX_QUOTES);
		expect(
			catalog.quotes.every(
				(quote) => quote.content.length <= MAX_CONTENT_LENGTH,
			),
		).toBe(true);

		for (const { slug } of CATALOG_CATEGORIES) {
			expect(
				catalog.quotes.filter((quote) => quote.categories.includes(slug)),
			).toHaveLength(MAX_QUOTES_PER_CATEGORY);
		}
	});

	test("also enforces unique normalized IDs for direct builder callers", () => {
		expect(() =>
			buildQuoteCatalog(
				[
					makeQuote("same", ["Wisdom"], "First"),
					makeQuote(" same ", ["Life"], "Second"),
				],
				{ seed: "duplicates" },
			),
		).toThrow("duplicate normalized _id: same");
	});

	test.each([
		[{ seed: "" }, "seed"],
		[{ seed: "test", maxContentLength: 0 }, "maxContentLength"],
		[{ seed: "test", maxQuotes: 0 }, "maxQuotes"],
		[{ seed: "test", maxQuotesPerCategory: 0 }, "maxQuotesPerCategory"],
	])("rejects invalid selection options %#", (options, message) => {
		expect(() => buildQuoteCatalog([], options)).toThrow(message);
	});
});

describe("catalog generation", () => {
	test("uses an explicit trimmed seed or the current UTC month", () => {
		const now = new Date("2026-07-31T23:59:59.000Z");

		expect(getDefaultCatalogSeed(now)).toBe("2026-07");
		expect(resolveCatalogSeed(" release-1.4 ", now)).toBe("release-1.4");
		expect(resolveCatalogSeed("   ", now)).toBe("2026-07");
	});

	test("renders an attributed, generated TypeScript module", () => {
		const sourceSha256 = "a".repeat(64);
		const output = renderQuoteCatalog(
			buildQuoteCatalog(makeCompleteSource(1), { seed: "render" }),
			sourceSha256,
		);

		expect(output).toContain("GENERATED FILE — DO NOT EDIT");
		expect(output).toContain("Quotable Data (package metadata: MIT)");
		expect(output).toContain(`Source SHA-256: ${sourceSha256}`);
		expect(output).toContain("Selection seed: render");
		expect(output).toContain("export const QUOTE_CATEGORIES =");
		expect(output).toContain("export const QUOTES =");
	});

	test("computes SHA-256 from the exact downloaded bytes", () => {
		expect(getSourceSha256(new TextEncoder().encode("abc"))).toBe(
			"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
		);
	});

	test("fetches, validates, renders, then writes a complete catalog", async () => {
		const source = makeCompleteSource();
		const sourceText = JSON.stringify(source);
		const sourceSha256 = getSourceSha256(new TextEncoder().encode(sourceText));
		const timeoutSignal = new AbortController().signal;
		const createTimeoutSignal = mock(() => timeoutSignal);
		const fetchImplementation = mock(
			async () => new Response(sourceText, { status: 200 }),
		) as unknown as typeof fetch;
		const writeGeneratedFile = mock(async () => undefined);

		const catalog = await refreshQuoteCatalog({
			createTimeoutSignal,
			fetchImplementation,
			outputPath: "/tmp/catalog.generated.ts",
			seed: "refresh",
			writeGeneratedFile,
		});

		expect(createTimeoutSignal).toHaveBeenCalledWith(SOURCE_FETCH_TIMEOUT_MS);
		expect(fetchImplementation).toHaveBeenCalledWith(expect.any(String), {
			signal: timeoutSignal,
		});
		expect(catalog.quotes).toHaveLength(MAX_QUOTES);
		expect(writeGeneratedFile).toHaveBeenCalledWith(
			"/tmp/catalog.generated.ts",
			expect.stringMatching(
				new RegExp(
					`Source SHA-256: ${sourceSha256}[\\s\\S]*Selection seed: refresh`,
				),
			),
		);
	});

	test("does not write a generated module over the UTF-8 size cap", async () => {
		const oversizedSource = makeCompleteSource(1).map((quote) => ({
			...quote,
			author: "A".repeat(MAX_GENERATED_CATALOG_BYTES),
		}));
		const writeGeneratedFile = mock(async () => undefined);

		await expect(
			refreshQuoteCatalog({
				fetchImplementation: mock(
					async () => new Response(JSON.stringify(oversizedSource)),
				) as unknown as typeof fetch,
				seed: "oversized",
				writeGeneratedFile,
			}),
		).rejects.toThrow(`exceeds the ${MAX_GENERATED_CATALOG_BYTES}-byte limit`);
		expect(writeGeneratedFile).not.toHaveBeenCalled();
	});

	test("never writes failed or incomplete upstream data", async () => {
		const writeGeneratedFile = mock(async () => undefined);

		await expect(
			refreshQuoteCatalog({
				fetchImplementation: mock(
					async () =>
						new Response("unavailable", { status: 503, statusText: "Offline" }),
				) as unknown as typeof fetch,
				seed: "failed-fetch",
				writeGeneratedFile,
			}),
		).rejects.toThrow("503 Offline");

		await expect(
			refreshQuoteCatalog({
				fetchImplementation: mock(
					async () => new Response("{", { status: 200 }),
				) as unknown as typeof fetch,
				seed: "invalid-json",
				writeGeneratedFile,
			}),
		).rejects.toThrow();

		await expect(
			refreshQuoteCatalog({
				fetchImplementation: mock(
					async () =>
						new Response(JSON.stringify([makeQuote("only", ["Wisdom"])])),
				) as unknown as typeof fetch,
				seed: "incomplete",
				writeGeneratedFile,
			}),
		).rejects.toThrow("friendship");

		expect(writeGeneratedFile).not.toHaveBeenCalled();
	});

	test("propagates an atomic writer failure", async () => {
		const writeGeneratedFile = mock(async () => {
			throw new Error("disk full");
		});

		await expect(
			refreshQuoteCatalog({
				fetchImplementation: mock(
					async () =>
						new Response(JSON.stringify(makeCompleteSource()), { status: 200 }),
				) as unknown as typeof fetch,
				seed: "write-failure",
				writeGeneratedFile,
			}),
		).rejects.toThrow("disk full");
		expect(writeGeneratedFile).toHaveBeenCalledTimes(1);
	});
});

describe("atomic generated-file writes", () => {
	test("replaces the destination and leaves no temporary file", async () => {
		const root = await mkdtemp(join(tmpdir(), "vivid-tab-quotes-"));
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
		const root = await mkdtemp(join(tmpdir(), "vivid-tab-quotes-"));
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
