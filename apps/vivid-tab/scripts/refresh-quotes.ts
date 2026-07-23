#!/usr/bin/env bun

import { createHash, randomUUID } from "node:crypto";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export const QUOTE_SOURCE_URL =
	"https://raw.githubusercontent.com/quotable-io/data/master/data/quotes.json";

export const CATALOG_CATEGORIES = [
	{ name: "Friendship", slug: "friendship" },
	{ name: "Happiness", slug: "happiness" },
	{ name: "Inspirational", slug: "inspirational" },
	{ name: "Life", slug: "life" },
	{ name: "Love", slug: "love" },
	{ name: "Success", slug: "success" },
	{ name: "Technology", slug: "technology" },
	{ name: "Wisdom", slug: "wisdom" },
] as const;

export const MAX_CONTENT_LENGTH = 80;
export const MAX_GENERATED_CATALOG_BYTES = 16 * 1024;
export const MAX_QUOTES = 48;
export const MAX_QUOTES_PER_CATEGORY = 6;
export const SOURCE_FETCH_TIMEOUT_MS = 25_000;

type CategorySlug = (typeof CATALOG_CATEGORIES)[number]["slug"];

export type SourceQuote = {
	_id: string;
	author: string;
	content: string;
	tags: string[];
};

export type CatalogQuote = {
	_id: string;
	author: string;
	categories: CategorySlug[];
	content: string;
};

export type QuoteCatalog = {
	categories: typeof CATALOG_CATEGORIES;
	quotes: CatalogQuote[];
	seed: string;
};

type BuildCatalogOptions = {
	maxContentLength?: number;
	maxQuotes?: number;
	maxQuotesPerCategory?: number;
	seed: string;
};

type RefreshQuoteCatalogOptions = {
	createTimeoutSignal?: (timeoutMs: number) => AbortSignal;
	fetchImplementation?: typeof fetch;
	now?: Date;
	outputPath?: string;
	seed?: string;
	writeGeneratedFile?: (path: string, content: string) => Promise<void>;
};

const CATEGORY_ORDER = new Map<CategorySlug, number>(
	CATALOG_CATEGORIES.map(({ slug }, index) => [slug, index]),
);

const normalizeWhitespace = (value: string) =>
	value.trim().replace(/\s+/g, " ");

const compareText = (left: string, right: string) =>
	left < right ? -1 : left > right ? 1 : 0;

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const parseRequiredString = (value: unknown, field: string, index: number) => {
	if (typeof value !== "string" || normalizeWhitespace(value).length === 0) {
		throw new TypeError(`Quote ${index} has an invalid ${field}`);
	}

	return value;
};

const assertUniqueNormalizedQuoteIds = (
	quotes: ReadonlyArray<Pick<SourceQuote, "_id">>,
) => {
	const normalizedIds = new Set<string>();

	for (const [index, quote] of quotes.entries()) {
		const normalizedId = normalizeWhitespace(quote._id);

		if (normalizedIds.has(normalizedId)) {
			throw new TypeError(
				`Quote ${index} has a duplicate normalized _id: ${normalizedId}`,
			);
		}

		normalizedIds.add(normalizedId);
	}
};

/**
 * Validates the complete upstream response before any filtering or file writes.
 */
export const parseSourceQuotes = (value: unknown): SourceQuote[] => {
	if (!Array.isArray(value)) {
		throw new TypeError("The quote source must return an array");
	}

	const parsedQuotes = value.map((quote, index) => {
		if (!isRecord(quote)) {
			throw new TypeError(`Quote ${index} must be an object`);
		}

		if (
			!Array.isArray(quote.tags) ||
			quote.tags.some(
				(tag) =>
					typeof tag !== "string" || normalizeWhitespace(tag).length === 0,
			)
		) {
			throw new TypeError(`Quote ${index} has invalid tags`);
		}

		return {
			_id: parseRequiredString(quote._id, "_id", index),
			author: parseRequiredString(quote.author, "author", index),
			content: parseRequiredString(quote.content, "content", index),
			tags: [...quote.tags],
		};
	});
	assertUniqueNormalizedQuoteIds(parsedQuotes);

	return parsedQuotes;
};

/**
 * Produces a fast, deterministic score without adding a hashing dependency.
 */
export const getSeededScore = (seed: string, value: string) => {
	let hash = 2_166_136_261;

	for (const character of `${seed}\0${value}`) {
		hash ^= character.codePointAt(0) ?? 0;
		hash = Math.imul(hash, 16_777_619);
	}

	return hash >>> 0;
};

const getSupportedCategories = (tags: string[]) => {
	const normalizedTags = new Set(
		tags.map((tag) => normalizeWhitespace(tag).toLowerCase()),
	);

	return CATALOG_CATEGORIES.map(({ slug }) => slug).filter((slug) =>
		normalizedTags.has(slug),
	);
};

const normalizeCandidates = (
	sourceQuotes: SourceQuote[],
	maxContentLength: number,
) => {
	const candidates = sourceQuotes
		.map<CatalogQuote>((quote) => ({
			_id: normalizeWhitespace(quote._id),
			author: normalizeWhitespace(quote.author),
			categories: getSupportedCategories(quote.tags),
			content: normalizeWhitespace(quote.content),
		}))
		.filter(
			(quote) =>
				quote.content.length <= maxContentLength && quote.categories.length > 0,
		)
		.sort(
			(left, right) =>
				compareText(left.content.toLowerCase(), right.content.toLowerCase()) ||
				compareText(left._id, right._id),
		);

	const uniqueQuotes = new Map<string, CatalogQuote>();

	for (const quote of candidates) {
		const contentKey = quote.content.toLowerCase();
		const existing = uniqueQuotes.get(contentKey);

		if (!existing) {
			uniqueQuotes.set(contentKey, quote);
			continue;
		}

		existing.categories = [
			...new Set([...existing.categories, ...quote.categories]),
		].sort(
			(left, right) =>
				(CATEGORY_ORDER.get(left) ?? 0) - (CATEGORY_ORDER.get(right) ?? 0),
		);
	}

	return [...uniqueQuotes.values()];
};

/**
 * Selects a small local catalog. The seed makes refreshes reproducible while
 * category and total limits prevent this optional widget from bloating builds.
 */
export const buildQuoteCatalog = (
	sourceQuotes: SourceQuote[],
	{
		maxContentLength = MAX_CONTENT_LENGTH,
		maxQuotes = MAX_QUOTES,
		maxQuotesPerCategory = MAX_QUOTES_PER_CATEGORY,
		seed,
	}: BuildCatalogOptions,
): QuoteCatalog => {
	assertUniqueNormalizedQuoteIds(sourceQuotes);
	if (!seed.trim()) throw new TypeError("A quote catalog seed is required");
	if (maxContentLength < 1) {
		throw new RangeError("maxContentLength must be greater than zero");
	}
	if (maxQuotes < 1)
		throw new RangeError("maxQuotes must be greater than zero");
	if (maxQuotesPerCategory < 1) {
		throw new RangeError("maxQuotesPerCategory must be greater than zero");
	}

	const candidates = normalizeCandidates(sourceQuotes, maxContentLength);
	const selected = new Map<string, CatalogQuote>();
	const categoryCounts = new Map<CategorySlug, number>(
		CATALOG_CATEGORIES.map(({ slug }) => [slug, 0]),
	);
	const categorySelectionOrder = CATALOG_CATEGORIES.map(
		({ slug }) => slug,
	).sort((left, right) => {
		const leftCandidates = candidates.filter((quote) =>
			quote.categories.includes(left),
		).length;
		const rightCandidates = candidates.filter((quote) =>
			quote.categories.includes(right),
		).length;

		return (
			leftCandidates - rightCandidates ||
			(CATEGORY_ORDER.get(left) ?? 0) - (CATEGORY_ORDER.get(right) ?? 0)
		);
	});

	for (const slug of categorySelectionOrder) {
		const rankedCandidates = candidates
			.filter((quote) => quote.categories.includes(slug))
			.sort((left, right) => {
				const leftScore = getSeededScore(
					seed,
					`${slug}\0${left._id}\0${left.content}`,
				);
				const rightScore = getSeededScore(
					seed,
					`${slug}\0${right._id}\0${right.content}`,
				);

				return leftScore - rightScore || compareText(left._id, right._id);
			});

		for (const quote of rankedCandidates) {
			if ((categoryCounts.get(slug) ?? 0) >= maxQuotesPerCategory) break;
			if (selected.size >= maxQuotes) break;

			const contentKey = quote.content.toLowerCase();

			if (selected.has(contentKey)) continue;
			if (
				quote.categories.some(
					(category) =>
						(categoryCounts.get(category) ?? 0) >= maxQuotesPerCategory,
				)
			) {
				continue;
			}

			selected.set(contentKey, quote);

			for (const category of quote.categories) {
				categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
			}
		}
	}

	return {
		categories: CATALOG_CATEGORIES,
		quotes: [...selected.values()],
		seed,
	};
};

export const getDefaultCatalogSeed = (now = new Date()) =>
	`${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

export const resolveCatalogSeed = (
	environmentSeed: string | undefined,
	now = new Date(),
) => environmentSeed?.trim() || getDefaultCatalogSeed(now);

const assertCompleteCatalog = (catalog: QuoteCatalog) => {
	if (catalog.quotes.length === 0 || catalog.quotes.length > MAX_QUOTES) {
		throw new Error("The generated quote catalog has an invalid size");
	}

	for (const { slug } of CATALOG_CATEGORIES) {
		const count = catalog.quotes.filter((quote) =>
			quote.categories.includes(slug),
		).length;

		if (count === 0 || count > MAX_QUOTES_PER_CATEGORY) {
			throw new Error(`The generated ${slug} quote category is invalid`);
		}
	}
};

/**
 * Renders the complete generated module so it can be replaced in one rename.
 */
export const renderQuoteCatalog = (
	catalog: QuoteCatalog,
	sourceSha256: string,
) => `/**
 * GENERATED FILE — DO NOT EDIT.
 * Refresh with: bun run quotes:refresh
 * Source: Quotable Data (package metadata: MIT), https://github.com/quotable-io/data
 * Data: ${QUOTE_SOURCE_URL}
 * Source SHA-256: ${sourceSha256}
 * Selection seed: ${catalog.seed}
 */
// biome-ignore format: Keep generated source deterministic.
export const QUOTE_CATEGORIES = ${JSON.stringify(catalog.categories, null, "\t")} as const;

// biome-ignore format: Keep generated source deterministic.
export const QUOTES = ${JSON.stringify(catalog.quotes, null, "\t")} as const;
`;

export const getSourceSha256 = (source: Uint8Array) =>
	createHash("sha256").update(source).digest("hex");

const assertGeneratedModuleSize = (generatedModule: string) => {
	const size = Buffer.byteLength(generatedModule, "utf8");

	if (size > MAX_GENERATED_CATALOG_BYTES) {
		throw new Error(
			`Generated quote catalog is ${size} bytes and exceeds the ${MAX_GENERATED_CATALOG_BYTES}-byte limit`,
		);
	}
};

/**
 * Writes beside the destination before renaming, keeping the previous catalog
 * intact if fetching, validation, rendering, or the temporary write fails.
 */
export const writeFileAtomically = async (path: string, content: string) => {
	await mkdir(dirname(path), { recursive: true });
	const temporaryPath = `${path}.${process.pid}.${randomUUID()}.tmp`;

	try {
		await writeFile(temporaryPath, content, "utf8");
		await rename(temporaryPath, path);
	} finally {
		await rm(temporaryPath, { force: true });
	}
};

export const refreshQuoteCatalog = async ({
	createTimeoutSignal = (timeoutMs) => AbortSignal.timeout(timeoutMs),
	fetchImplementation = fetch,
	now = new Date(),
	outputPath = resolve(
		__dirname,
		"..",
		"src",
		"data",
		"quotes",
		"catalog.generated.ts",
	),
	seed = resolveCatalogSeed(process.env.QUOTE_CATALOG_SEED, now),
	writeGeneratedFile = writeFileAtomically,
}: RefreshQuoteCatalogOptions = {}) => {
	const signal = createTimeoutSignal(SOURCE_FETCH_TIMEOUT_MS);
	const response = await fetchImplementation(QUOTE_SOURCE_URL, { signal });

	if (!response.ok) {
		throw new Error(
			`Unable to fetch quotes: ${response.status} ${response.statusText}`.trim(),
		);
	}

	const sourceBytes = new Uint8Array(await response.arrayBuffer());
	const sourceText = new TextDecoder().decode(sourceBytes);
	const sourceQuotes = parseSourceQuotes(JSON.parse(sourceText) as unknown);
	const catalog = buildQuoteCatalog(sourceQuotes, { seed });
	assertCompleteCatalog(catalog);
	const generatedModule = renderQuoteCatalog(
		catalog,
		getSourceSha256(sourceBytes),
	);
	assertGeneratedModuleSize(generatedModule);

	await writeGeneratedFile(outputPath, generatedModule);

	return catalog;
};

if (require.main === module) {
	refreshQuoteCatalog()
		.then((catalog) => {
			console.log(
				`Generated ${catalog.quotes.length} local quotes with seed ${catalog.seed}.`,
			);
		})
		.catch((error: unknown) => {
			console.error(error instanceof Error ? error.message : String(error));
			process.exitCode = 1;
		});
}
