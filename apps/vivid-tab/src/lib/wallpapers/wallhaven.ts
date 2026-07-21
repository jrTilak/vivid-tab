import * as z from "zod/mini";
import { DEFAULT_SEARCH_TERMS } from "@/constants/wallpapers";
import { randomInt } from "@/lib/random-int";
import { shuffle } from "@/lib/shuffle";

const WALLHAVEN_API_URL = "https://wallhaven.cc/api/v1/search";

const WallhavenImageSchema = z.object({
	path: z.url(),
	thumbs: z.optional(z.unknown()),
});

const WallhavenThumbnailSchema = z.object({
	large: z.url(),
});

const WallhavenResponseSchema = z.object({
	data: z.array(z.unknown()),
});

/**
 * Validated full-resolution and gallery URLs retained from one Wallhaven
 * response record.
 */
export type WallhavenImage = {
	src: string;
	thumbnailSrc: string;
};

/**
 * Fetches and validates safe wallpaper choices from the Wallhaven API.
 */
export class Wallhaven {
	readonly sourceName = "wallhaven";

	/**
	 * Fetches a randomized, bounded collection of valid Wallhaven images.
	 *
	 * A failed random page is retried once on page one because smaller result
	 * sets often do not contain four pages.
	 *
	 * @param searchTerms - Preferred search terms; curated defaults are used when
	 * the collection is empty.
	 * @param count - Maximum number of images to return.
	 * @returns Valid images, or an empty array when the service is unavailable.
	 */
	async fetchImages(
		searchTerms: readonly string[] = [],
		count = 10,
	): Promise<WallhavenImage[]> {
		const terms = this._resolveSearchTerms(searchTerms);
		const searchTerm = terms[randomInt(0, terms.length - 1)] ?? terms[0];
		const page = randomInt(1, 4);

		let images = await this._fetchPage(searchTerm, page);

		if (images.length === 0 && page !== 1) {
			images = await this._fetchPage(searchTerm, 1);
		}

		return shuffle(images).slice(0, Math.max(0, count));
	}

	/**
	 * Normalizes persisted keywords and restores curated defaults when every
	 * configured entry is blank.
	 */
	private _resolveSearchTerms(searchTerms: readonly string[]): string[] {
		const normalizedTerms = searchTerms
			.map((term) => term.trim().toLowerCase())
			.filter(Boolean);

		return normalizedTerms.length > 0
			? normalizedTerms
			: [...DEFAULT_SEARCH_TERMS];
	}

	/**
	 * Builds an encoded request constrained to safe, Full HD results. Keeping
	 * provider-specific query rules here prevents them leaking into the service.
	 */
	private _buildSearchUrl({
		page,
		searchTerm,
		seed,
	}: {
		page: number;
		searchTerm: string;
		seed: string;
	}): string {
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
	}

	/**
	 * Validates each untrusted API record independently. A malformed thumbnail
	 * falls back to the valid full image instead of discarding the whole record.
	 */
	private _parseResponse(value: unknown): WallhavenImage[] {
		const result = z.safeParse(WallhavenResponseSchema, value);
		if (!result.success) return [];

		return result.data.data.flatMap((item) => {
			const image = z.safeParse(WallhavenImageSchema, item);
			if (!image.success) return [];

			const thumbnail = z.safeParse(
				WallhavenThumbnailSchema,
				image.data.thumbs,
			);

			return [
				{
					src: image.data.path,
					thumbnailSrc: thumbnail.success
						? thumbnail.data.large
						: image.data.path,
				},
			];
		});
	}

	/**
	 * Owns the network and decoding boundary for a single result page, converting
	 * provider or transport failures into an empty collection for retry/fallback.
	 */
	private async _fetchPage(
		searchTerm: string,
		page: number,
	): Promise<WallhavenImage[]> {
		try {
			const response = await fetch(
				this._buildSearchUrl({
					page,
					searchTerm,
					seed: Date.now().toString(),
				}),
			);

			if (!response.ok) return [];

			return this._parseResponse(await response.json());
		} catch (error) {
			console.error("Wallhaven fetch error:", error);

			return [];
		}
	}
}
