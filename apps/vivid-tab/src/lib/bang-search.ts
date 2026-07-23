import { BANGS, type LocalBang } from "@/data/bangs";

const BANG_TOKEN_PATTERN = /^!([a-z0-9._-]+)$/i;
const DEFAULT_FORMAT = new Set([
	"open_base_path",
	"open_snap_domain",
	"url_encode_placeholder",
	"url_encode_space_to_plus",
]);

const BANG_BY_TRIGGER = new Map<string, LocalBang>();

for (const bang of BANGS) {
	for (const trigger of bang.triggers) {
		BANG_BY_TRIGGER.set(trigger, bang);
	}
}

export type BangPosition = "leading" | "trailing";

export type ParsedBangQuery = {
	position: BangPosition;
	query: string;
	trigger: string;
};

export type BangSearchResolution =
	| {
			bang: LocalBang;
			kind: "bang";
			position: BangPosition;
			query: string;
			trigger: string;
			url: string;
	  }
	| { kind: "search"; query: string };

const normalizeTrigger = (trigger: string) =>
	trigger.trim().replace(/^!/, "").toLowerCase();

/** Finds a bundled bang by its canonical trigger or an upstream alias. */
export const findBang = (trigger: string) =>
	BANG_BY_TRIGGER.get(normalizeTrigger(trigger));

/**
 * Parses one bang token at either query boundary. Ambiguous queries containing
 * both a leading and trailing bang are deliberately left as ordinary search.
 */
export const parseBangQuery = (rawQuery: unknown): ParsedBangQuery | null => {
	if (typeof rawQuery !== "string") return null;

	const value = rawQuery.trim();
	if (!value) return null;

	const tokens = value.split(/\s+/);
	const firstMatch = BANG_TOKEN_PATTERN.exec(tokens[0] as string);
	const lastMatch = BANG_TOKEN_PATTERN.exec(tokens.at(-1) as string);

	if (tokens.length > 1 && firstMatch && lastMatch) return null;

	if (firstMatch) {
		return {
			position: "leading",
			query: tokens.slice(1).join(" "),
			trigger: (firstMatch[1] as string).toLowerCase(),
		};
	}

	if (lastMatch) {
		return {
			position: "trailing",
			query: tokens.slice(0, -1).join(" "),
			trigger: (lastMatch[1] as string).toLowerCase(),
		};
	}

	return null;
};

const replaceMalformedSurrogates = (value: string) =>
	Array.from(value, (character) => {
		const codeUnit = character.charCodeAt(0);
		return character.length === 1 && codeUnit >= 0xd800 && codeUnit <= 0xdfff
			? "\uFFFD"
			: character;
	}).join("");

const encodeBangQuery = (query: string, usePlusForSpaces: boolean) => {
	const encoded = encodeURIComponent(replaceMalformedSurrogates(query));

	return usePlusForSpaces ? encoded.replace(/%20/g, "+") : encoded;
};

/** Resolves a validated local bang and query to its destination URL. */
export const resolveBangUrl = (bang: LocalBang, query: string) => {
	const format = new Set(bang.format ?? DEFAULT_FORMAT);

	if (!query) {
		if (format.has("open_snap_domain") && bang.snapDomain) {
			return `https://${bang.snapDomain}/`;
		}

		if (format.has("open_base_path")) {
			return new URL("/", bang.template).href;
		}
	}

	const replacement = format.has("url_encode_placeholder")
		? encodeBangQuery(query, format.has("url_encode_space_to_plus"))
		: query;

	return bang.template.replaceAll("{{{s}}}", replacement);
};

/**
 * Resolves a supported bang locally, otherwise preserves the complete input as
 * an ordinary browser-search query. This function never performs network I/O.
 */
export const resolveBangSearch = (rawQuery: unknown): BangSearchResolution => {
	const query = typeof rawQuery === "string" ? rawQuery.trim() : "";
	const parsed = parseBangQuery(rawQuery);
	if (!parsed) return { kind: "search", query };

	const bang = findBang(parsed.trigger);
	if (!bang) return { kind: "search", query };

	return {
		...parsed,
		bang,
		kind: "bang",
		url: resolveBangUrl(bang, parsed.query),
	};
};
