import * as z from "zod/mini";
import { DEFAULT_WALLHAVEN_SEARCH_TERMS } from "@/constants/wallpapers";
import { randomInt } from "@/lib/random";

const WALLHAVEN_API_URL = "https://wallhaven.cc/api/v1/search";

const WallhavenImageSchema = z.object({
	path: z.url(),
	thumbs: z.optional(
		z.object({
			large: z.url(),
		}),
	),
});

const WallhavenResponseSchema = z.object({
	data: z.array(WallhavenImageSchema),
});

export type WallhavenImage = {
	src: string;
	thumbnailSrc: string;
};

export const resolveWallhavenSearchTerms = (
	searchTerms: readonly string[] = [],
): string[] => {
	const normalizedTerms = searchTerms
		.map((term) => term.trim().toLowerCase())
		.filter(Boolean);

	return normalizedTerms.length > 0
		? normalizedTerms
		: [...DEFAULT_WALLHAVEN_SEARCH_TERMS];
};

/** Builds a safe-only Wallhaven request without manually concatenating input. */
export const buildWallhavenSearchUrl = ({
	page,
	searchTerm,
	seed,
}: {
	page: number;
	searchTerm: string;
	seed: string;
}): string => {
	const url = new URL(WALLHAVEN_API_URL);
	url.search = new URLSearchParams({
		page: String(page),
		purity: "100",
		q: searchTerm,
		resolutions: "1920x1080",
		seed,
		sorting: "random",
	}).toString();

	return url.toString();
};

export const parseWallhavenResponse = (value: unknown): WallhavenImage[] => {
	const result = z.safeParse(WallhavenResponseSchema, value);

	if (!result.success) return [];

	return result.data.data.map(({ path, thumbs }) => ({
		src: path,
		thumbnailSrc: thumbs?.large ?? path,
	}));
};

const shuffle = <T>(values: readonly T[]): T[] => {
	const shuffled = [...values];

	for (let index = shuffled.length - 1; index > 0; index--) {
		const swapIndex = randomInt(0, index);
		const current = shuffled[index];
		shuffled[index] = shuffled[swapIndex] as T;
		shuffled[swapIndex] = current as T;
	}

	return shuffled;
};

export class Wallhaven {
	readonly sourceName = "wallhaven";

	async fetchImages(
		searchTerms: readonly string[] = [],
		count = 10,
	): Promise<WallhavenImage[]> {
		const terms = resolveWallhavenSearchTerms(searchTerms);
		const searchTerm = terms[randomInt(0, terms.length - 1)] ?? terms[0];
		const page = randomInt(1, 4);

		let images = await this.fetchPage(searchTerm, page);

		if (images.length === 0 && page !== 1) {
			images = await this.fetchPage(searchTerm, 1);
		}

		return shuffle(images).slice(0, Math.max(0, count));
	}

	private async fetchPage(
		searchTerm: string,
		page: number,
	): Promise<WallhavenImage[]> {
		try {
			const response = await fetch(
				buildWallhavenSearchUrl({
					page,
					searchTerm,
					seed: Date.now().toString(),
				}),
			);

			if (!response.ok) return [];

			return parseWallhavenResponse(await response.json());
		} catch (error) {
			console.error("Wallhaven fetch error:", error);

			return [];
		}
	}
}
