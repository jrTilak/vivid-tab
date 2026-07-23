#!/usr/bin/env bun

import { createHash, randomUUID } from "node:crypto";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export const BANG_SOURCE_URL =
	"https://raw.githubusercontent.com/kagisearch/bangs/main/data/bangs.json";

/**
 * High-value destinations are selected explicitly so refreshing upstream data
 * cannot silently increase the extension bundle by thousands of entries.
 */
export const SELECTED_BANG_TRIGGERS = [
	"a",
	"ae",
	"airbnb",
	"ap",
	"appstore",
	"archive",
	"archived",
	"arx",
	"b",
	"bbc",
	"book",
	"brave",
	"cargo",
	"chatgpt",
	"claude",
	"cnn",
	"dax",
	"dev.to",
	"dict",
	"disney",
	"docker",
	"docsrs",
	"drive",
	"ebay",
	"epic",
	"etsy",
	"facebook",
	"g",
	"gcal",
	"gen",
	"gh",
	"gi",
	"glab",
	"gmail",
	"gmap",
	"gnews",
	"gr",
	"gsch",
	"gs",
	"gten",
	"hn",
	"hulu",
	"ig",
	"imdb",
	"javascript",
	"lbx",
	"li",
	"like",
	"mb",
	"medium",
	"netflix",
	"npmjs",
	"osm",
	"ov",
	"perplexity",
	"pmd",
	"pypi",
	"reddit",
	"reuq",
	"rottentomatoes",
	"scloud",
	"spotify",
	"steam",
	"tiktok",
	"tripadvisor",
	"twitchc",
	"ud",
	"wa",
	"walmart",
	"wikipedia",
	"x",
	"yahoo",
	"yt",
] as const;

export const BANG_FORMAT_FLAGS = [
	"open_base_path",
	"open_snap_domain",
	"url_encode_placeholder",
	"url_encode_space_to_plus",
] as const;

export const MAX_GENERATED_CATALOG_BYTES = 32 * 1024;
export const SOURCE_FETCH_TIMEOUT_MS = 25_000;

const QUERY_PLACEHOLDER = "{{{s}}}";
const SAFE_TRIGGER_PATTERN = /^[a-z0-9._-]+$/i;
const SUPPORTED_PROTOCOLS = new Set(["http:", "https:"]);
const SUPPORTED_FORMAT_FLAGS = new Set<string>(BANG_FORMAT_FLAGS);

/** Existing packaged icons, keyed by the canonical upstream trigger. */
export const LOCAL_ICON_BY_BANG_TRIGGER: Readonly<Record<string, string>> = {
	chatgpt: "assets/openai.png",
	claude: "assets/claude.png",
	drive: "assets/drive.png",
	gmail: "assets/gmail.png",
	li: "assets/linkedin.png",
	x: "assets/x.png",
	yt: "assets/youtube.png",
};

export type BangFormatFlag = (typeof BANG_FORMAT_FLAGS)[number];

export type SourceBang = {
	ad?: string;
	d: string;
	fmt?: BangFormatFlag[];
	s: string;
	t: string;
	ts?: string[];
	u: string;
	x?: string;
};

export type CatalogBang = {
	domain: string;
	format?: BangFormatFlag[];
	icon?: string;
	name: string;
	snapDomain?: string;
	template: string;
	triggers: string[];
};

type RefreshBangCatalogOptions = {
	createTimeoutSignal?: (timeoutMs: number) => AbortSignal;
	fetchImplementation?: typeof fetch;
	outputPath?: string;
	writeGeneratedFile?: (path: string, content: string) => Promise<void>;
};

const normalizeWhitespace = (value: string) =>
	value.trim().replace(/\s+/g, " ");

const normalizeTrigger = (value: string) =>
	normalizeWhitespace(value).toLowerCase();

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const parseRequiredString = (value: unknown, field: string, index: number) => {
	if (typeof value !== "string" || normalizeWhitespace(value).length === 0) {
		throw new TypeError(`Bang ${index} has an invalid ${field}`);
	}

	return value;
};

const parseOptionalString = (value: unknown, field: string, index: number) => {
	if (value === undefined || value === null) return undefined;
	if (typeof value === "string" && normalizeWhitespace(value).length === 0) {
		return undefined;
	}

	return parseRequiredString(value, field, index);
};

const parseOptionalStringArray = (
	value: unknown,
	field: string,
	index: number,
) => {
	if (value === undefined || value === null) return undefined;
	if (
		!Array.isArray(value) ||
		value.some(
			(item) =>
				typeof item !== "string" || normalizeWhitespace(item).length === 0,
		)
	) {
		throw new TypeError(`Bang ${index} has an invalid ${field}`);
	}

	return [...value] as string[];
};

const parseFormat = (value: unknown, index: number) => {
	const format = parseOptionalStringArray(value, "fmt", index);

	if (format?.some((flag) => !SUPPORTED_FORMAT_FLAGS.has(flag))) {
		throw new TypeError(`Bang ${index} has an unsupported fmt flag`);
	}

	return format as BangFormatFlag[] | undefined;
};

/** Validates the complete Kagi response before selecting the bundled subset. */
export const parseSourceBangs = (value: unknown): SourceBang[] => {
	if (!Array.isArray(value)) {
		throw new TypeError("The bang source must return an array");
	}

	const parsedBangs = value.map((bang, index) => {
		if (!isRecord(bang)) {
			throw new TypeError(`Bang ${index} must be an object`);
		}

		return {
			ad: parseOptionalString(bang.ad, "ad", index),
			d: parseRequiredString(bang.d, "d", index),
			fmt: parseFormat(bang.fmt, index),
			s: parseRequiredString(bang.s, "s", index),
			t: parseRequiredString(bang.t, "t", index),
			ts: parseOptionalStringArray(bang.ts, "ts", index),
			u: parseRequiredString(bang.u, "u", index),
			x: parseOptionalString(bang.x, "x", index),
		};
	});

	const canonicalTriggers = new Set<string>();

	for (const [index, bang] of parsedBangs.entries()) {
		const trigger = normalizeTrigger(bang.t);

		if (canonicalTriggers.has(trigger)) {
			throw new TypeError(
				`Bang ${index} has a duplicate canonical trigger: ${trigger}`,
			);
		}

		canonicalTriggers.add(trigger);
	}

	return parsedBangs;
};

const assertSafeTemplate = (bang: SourceBang) => {
	if (bang.x !== undefined) {
		throw new Error(
			`Selected bang ${bang.t} requires unsupported regex parsing`,
		);
	}
	if (!bang.u.includes(QUERY_PLACEHOLDER)) {
		throw new Error(`Selected bang ${bang.t} has no search placeholder`);
	}

	let template: URL;

	try {
		template = new URL(bang.u);
	} catch {
		throw new Error(`Selected bang ${bang.t} has an invalid URL template`);
	}

	if (!SUPPORTED_PROTOCOLS.has(template.protocol)) {
		throw new Error(`Selected bang ${bang.t} has an unsafe URL protocol`);
	}

	if (bang.ad) {
		const normalizedSnapDomain = normalizeWhitespace(bang.ad).toLowerCase();
		const snapUrl = new URL(`https://${normalizedSnapDomain}`);

		if (
			snapUrl.hostname !== normalizedSnapDomain ||
			snapUrl.pathname !== "/" ||
			snapUrl.search ||
			snapUrl.hash
		) {
			throw new Error(`Selected bang ${bang.t} has an invalid snap domain`);
		}
	}
};

/**
 * Selects a stable, small catalog while retaining useful upstream aliases.
 * Non-ASCII aliases are omitted because the documented bang grammar is ASCII.
 */
export const buildBangCatalog = (
	sourceBangs: SourceBang[],
	selectedTriggers: readonly string[] = SELECTED_BANG_TRIGGERS,
): CatalogBang[] => {
	const normalizedSelectedTriggers = selectedTriggers.map(normalizeTrigger);

	if (
		normalizedSelectedTriggers.some(
			(trigger) => !SAFE_TRIGGER_PATTERN.test(trigger),
		) ||
		new Set(normalizedSelectedTriggers).size !==
			normalizedSelectedTriggers.length
	) {
		throw new Error("Selected bang triggers must be unique and valid");
	}

	const sourceByTrigger = new Map<string, SourceBang>();

	for (const bang of sourceBangs) {
		const canonicalTrigger = normalizeTrigger(bang.t);
		if (sourceByTrigger.has(canonicalTrigger)) {
			throw new Error(`Duplicate upstream bang trigger: ${canonicalTrigger}`);
		}
		sourceByTrigger.set(canonicalTrigger, bang);
	}

	const claimedTriggers = new Map<string, string>();

	return normalizedSelectedTriggers.map((canonicalTrigger) => {
		const bang = sourceByTrigger.get(canonicalTrigger);

		if (!bang) {
			throw new Error(`Selected bang is missing upstream: ${canonicalTrigger}`);
		}

		assertSafeTemplate(bang);

		const triggers = [
			...new Set(
				[bang.t, ...(bang.ts ?? [])]
					.map(normalizeTrigger)
					.filter((trigger) => SAFE_TRIGGER_PATTERN.test(trigger)),
			),
		];

		for (const trigger of triggers) {
			const owner = claimedTriggers.get(trigger);

			if (owner && owner !== canonicalTrigger) {
				throw new Error(
					`Selected bangs ${owner} and ${canonicalTrigger} share trigger: ${trigger}`,
				);
			}

			claimedTriggers.set(trigger, canonicalTrigger);
		}

		return {
			domain: normalizeWhitespace(bang.d).toLowerCase(),
			format: bang.fmt ? [...bang.fmt] : undefined,
			icon: LOCAL_ICON_BY_BANG_TRIGGER[canonicalTrigger],
			name: normalizeWhitespace(bang.s),
			snapDomain: bang.ad
				? normalizeWhitespace(bang.ad).toLowerCase()
				: undefined,
			template: normalizeWhitespace(bang.u),
			triggers,
		};
	});
};

const assertCompleteCatalog = (catalog: CatalogBang[]) => {
	if (catalog.length !== SELECTED_BANG_TRIGGERS.length) {
		throw new Error("The generated bang catalog has an invalid size");
	}

	const triggers = catalog.flatMap((bang) => bang.triggers);

	if (new Set(triggers).size !== triggers.length) {
		throw new Error("The generated bang catalog has duplicate triggers");
	}
};

/** Renders the complete module so it can be replaced with one atomic rename. */
export const renderBangCatalog = (
	catalog: CatalogBang[],
	sourceSha256: string,
) => `/**
 * GENERATED FILE — DO NOT EDIT.
 * Refresh with: bun run bangs:refresh
 * Source: Kagi Bangs (MIT, Copyright (c) 2024 Kagi Search)
 * Repository: https://github.com/kagisearch/bangs
 * Data: ${BANG_SOURCE_URL}
 * Source SHA-256: ${sourceSha256}
 */
// biome-ignore format: Keep generated source deterministic.
export const BANGS = ${JSON.stringify(catalog, null, "\t")} as const;
`;

export const getSourceSha256 = (source: Uint8Array) =>
	createHash("sha256").update(source).digest("hex");

const assertGeneratedModuleSize = (generatedModule: string) => {
	const size = Buffer.byteLength(generatedModule, "utf8");

	if (size > MAX_GENERATED_CATALOG_BYTES) {
		throw new Error(
			`Generated bang catalog is ${size} bytes and exceeds the ${MAX_GENERATED_CATALOG_BYTES}-byte limit`,
		);
	}
};

/** Keeps the previous catalog intact if validation or the temporary write fails. */
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

export const refreshBangCatalog = async ({
	createTimeoutSignal = (timeoutMs) => AbortSignal.timeout(timeoutMs),
	fetchImplementation = fetch,
	outputPath = resolve(
		__dirname,
		"..",
		"src",
		"data",
		"bangs",
		"catalog.generated.ts",
	),
	writeGeneratedFile = writeFileAtomically,
}: RefreshBangCatalogOptions = {}) => {
	const signal = createTimeoutSignal(SOURCE_FETCH_TIMEOUT_MS);
	const response = await fetchImplementation(BANG_SOURCE_URL, { signal });

	if (!response.ok) {
		throw new Error(
			`Unable to fetch bangs: ${response.status} ${response.statusText}`.trim(),
		);
	}

	const sourceBytes = new Uint8Array(await response.arrayBuffer());
	const sourceText = new TextDecoder().decode(sourceBytes);
	const sourceBangs = parseSourceBangs(JSON.parse(sourceText) as unknown);
	const catalog = buildBangCatalog(sourceBangs);
	assertCompleteCatalog(catalog);
	const generatedModule = renderBangCatalog(
		catalog,
		getSourceSha256(sourceBytes),
	);
	assertGeneratedModuleSize(generatedModule);

	await writeGeneratedFile(outputPath, generatedModule);

	return catalog;
};

if (require.main === module) {
	refreshBangCatalog()
		.then((catalog) => {
			console.log(`Generated ${catalog.length} local bangs.`);
		})
		.catch((error: unknown) => {
			console.error(error instanceof Error ? error.message : String(error));
			process.exitCode = 1;
		});
}
