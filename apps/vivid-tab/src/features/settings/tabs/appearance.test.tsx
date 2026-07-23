import {
	afterEach,
	beforeAll,
	describe,
	expect,
	jest,
	mock,
	test,
} from "@test/jest";
import { cleanup, render, screen } from "@testing-library/react";
import { createDefaultSettings } from "@/lib/settings-storage";

const mockSetSettings = mock(() => undefined);
const mockUseSettings = mock(() => ({
	setSettings: mockSetSettings,
	settings: createDefaultSettings(),
}));

jest.mock("@/providers/settings-provider", () => ({
	useSettings: mockUseSettings,
}));

let AppearanceSettings: typeof import("./appearance").default;

beforeAll(async () => {
	({ default: AppearanceSettings } = await import("./appearance"));
});

afterEach(cleanup);

describe("AppearanceSettings", () => {
	test("marks every appearance control as new", () => {
		render(<AppearanceSettings />);

		expect(screen.getAllByText("New")).toHaveLength(3);
		for (const label of ["Theme", "Corner radius", "Visual effect"]) {
			expect(screen.getByText(label)).not.toBeNull();
		}
	});
});
