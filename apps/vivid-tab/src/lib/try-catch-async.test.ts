import { describe, expect, test } from "@test";
import { tryCatchAsync } from "./try-catch-async";

describe("tryCatchAsync", () => {
	test("returns resolved values without an error", async () => {
		await expect(tryCatchAsync(async () => "done")).resolves.toEqual([
			undefined,
			"done",
		]);
	});

	test("preserves an undefined resolved value", async () => {
		await expect(tryCatchAsync(async () => undefined)).resolves.toEqual([
			undefined,
			undefined,
		]);
	});

	test("returns the original rejection and no value", async () => {
		const error = new TypeError("failed");

		await expect(
			tryCatchAsync(async () => {
				throw error;
			}),
		).resolves.toEqual([error, undefined]);
	});

	test("preserves non-Error rejection values without an unsafe cast", async () => {
		await expect(
			tryCatchAsync(async () => {
				throw "cancelled";
			}),
		).resolves.toEqual(["cancelled", undefined]);
	});
});
