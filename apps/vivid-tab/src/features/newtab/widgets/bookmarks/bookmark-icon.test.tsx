import { describe, expect, test } from "@test/jest";
import { fireEvent, render } from "@testing-library/react";
import { BookmarkIcon } from "./bookmark-icon";

describe("BookmarkIcon", () => {
	test("tries each unique source before showing initials", () => {
		const { container } = render(
			<BookmarkIcon
				sources={[
					"https://example.com/apple-touch-icon.png",
					"https://example.com/apple-touch-icon.png",
					"https://example.com/favicon.ico",
				]}
				title="Vivid Tab"
			/>,
		);

		let image = container.querySelector("img");
		expect(image?.getAttribute("src")).toBe(
			"https://example.com/apple-touch-icon.png",
		);

		fireEvent.error(image as HTMLImageElement);
		image = container.querySelector("img");
		expect(image?.getAttribute("src")).toBe("https://example.com/favicon.ico");

		fireEvent.error(image as HTMLImageElement);
		expect(container.querySelector("img")).toBeNull();
		expect(container.textContent).toBe("VT");
	});

	test("ignores empty sources", () => {
		const { container } = render(
			<BookmarkIcon sources={[null, undefined, ""]} title="Fallback" />,
		);

		expect(container.querySelector("img")).toBeNull();
		expect(container.textContent).toBe("F");
	});

	test("retries sources when a rendered bookmark changes", () => {
		const { container, rerender } = render(
			<BookmarkIcon sources={["https://example.com/old.png"]} title="Old" />,
		);

		fireEvent.error(container.querySelector("img") as HTMLImageElement);
		expect(container.querySelector("img")).toBeNull();

		rerender(
			<BookmarkIcon sources={["https://example.com/new.png"]} title="New" />,
		);

		expect(container.querySelector("img")?.getAttribute("src")).toBe(
			"https://example.com/new.png",
		);
	});
});
