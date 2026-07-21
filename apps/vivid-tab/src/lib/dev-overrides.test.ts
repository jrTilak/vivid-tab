import { describe, expect, test } from "@test";
import { resolveDevOverrides } from "./dev-overrides";

describe("resolveDevOverrides", () => {
	test("returns validated overrides in development", () => {
		expect(
			resolveDevOverrides({
				NODE_ENV: "development",
				PLASMO_PUBLIC_DEV_RADIUS: "none",
				PLASMO_PUBLIC_DEV_VISUAL_EFFECT: "opaque",
				PLASMO_PUBLIC_DEV_THEME: "light",
			}),
		).toEqual({
			radius: "none",
			visualEffect: "opaque",
			theme: "light",
		});
	});

	test("ignores every override outside development", () => {
		expect(
			resolveDevOverrides({
				NODE_ENV: "production",
				PLASMO_PUBLIC_DEV_RADIUS: "none",
				PLASMO_PUBLIC_DEV_VISUAL_EFFECT: "opaque",
				PLASMO_PUBLIC_DEV_THEME: "light",
			}),
		).toEqual({});
	});

	test("ignores invalid values independently", () => {
		expect(
			resolveDevOverrides({
				NODE_ENV: "development",
				PLASMO_PUBLIC_DEV_RADIUS: "large",
				PLASMO_PUBLIC_DEV_VISUAL_EFFECT: "glass",
				PLASMO_PUBLIC_DEV_THEME: "midnight",
			}),
		).toEqual({
			radius: undefined,
			visualEffect: undefined,
			theme: undefined,
		});
	});

	test("keeps valid overrides when other values are missing", () => {
		expect(
			resolveDevOverrides({
				NODE_ENV: "development",
				PLASMO_PUBLIC_DEV_RADIUS: "sm",
				PLASMO_PUBLIC_DEV_THEME: "system",
			}),
		).toEqual({
			radius: "sm",
			visualEffect: undefined,
			theme: "system",
		});
	});
});
