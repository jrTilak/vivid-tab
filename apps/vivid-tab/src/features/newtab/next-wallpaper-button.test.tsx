import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	jest,
	mock,
	test,
} from "@test/jest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const mockNextWallpaper = mock(() => undefined);
let mockHasWallpapers = true;

jest.mock("@/hooks/use-next-wallpaper", () => ({
	useNextWallpaper: () => ({
		hasWallpapers: mockHasWallpapers,
		nextWallpaper: mockNextWallpaper,
	}),
}));

let NextWallpaperButton: typeof import("./next-wallpaper-button").NextWallpaperButton;

beforeAll(async () => {
	({ NextWallpaperButton } = await import("./next-wallpaper-button"));
});

beforeEach(() => {
	mockHasWallpapers = true;
	mockNextWallpaper.mockClear();
});

afterEach(cleanup);

describe("NextWallpaperButton", () => {
	test("uses the shared themed icon button", () => {
		render(<NextWallpaperButton />);
		const button = screen.getByRole("button", { name: "Next wallpaper" });

		expect(button.getAttribute("data-variant")).toBe("secondary");
		expect(button.getAttribute("data-size")).toBe("icon");
		expect(button.className).toContain("z-40");

		fireEvent.click(button);
		expect(mockNextWallpaper).toHaveBeenCalledTimes(1);
	});

	test("stays hidden when no alternative wallpaper is available", () => {
		mockHasWallpapers = false;
		render(<NextWallpaperButton />);

		expect(screen.queryByRole("button", { name: "Next wallpaper" })).toBeNull();
	});
});
