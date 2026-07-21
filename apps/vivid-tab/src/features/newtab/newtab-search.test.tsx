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
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";

type SearchDialogProps = {
	onOpenChange: (open: boolean) => void;
	open: boolean;
};

const mockSearchDialog = mock((_props: SearchDialogProps) => null);
const mockNewtabWidget = mock((_props: { id?: string }) => null);
const mockUseToggleSearchCommand = mock((_onToggle: () => void) => undefined);
const mockUseSettings = mock(() => ({
	settings: {
		general: { bookmarksCanTakeExtraSpaceIfAvailable: true },
		widgets: { layout: { 4: "bookmarks" } },
	},
}));
let mockCommandShortcut: string | null = "Ctrl+Shift+Space";

jest.mock("@/features/dialogs/search", () => ({
	__esModule: true,
	default: (props: SearchDialogProps) => mockSearchDialog(props),
}));
jest.mock("@/features/dialogs/search/use-command-shortcut", () => ({
	useCommandShortcut: () => mockCommandShortcut,
}));
jest.mock("@/features/dialogs/search/use-toggle-search-command", () => ({
	useToggleSearchCommand: (onToggle: () => void) =>
		mockUseToggleSearchCommand(onToggle),
}));
jest.mock("@/providers/settings-provider", () => ({
	useSettings: () => mockUseSettings(),
}));
jest.mock("@/components/wallpaper-background", () => ({
	WallpaperBackground: () => null,
}));
jest.mock("@/features/newtab/next-wallpaper-button", () => ({
	NextWallpaperButton: () => null,
}));
jest.mock("@/features/newtab/use-xl-layout", () => ({
	useXlLayout: () => false,
}));
jest.mock("@/features/newtab/widget-registry", () => ({
	NewtabWidget: (props: { id?: string }) => mockNewtabWidget(props),
}));
jest.mock("@/features/newtab/widgets/searchbar/popular-apps", () => ({
	PopularApps: () => null,
}));

let Homepage: typeof import(".").default;
let NewtabSearchProvider: typeof import("./newtab-search").NewtabSearchProvider;
let Searchbar: typeof import("./widgets/searchbar").Searchbar;

beforeAll(async () => {
	({ default: Homepage } = await import("."));
	({ NewtabSearchProvider } = await import("./newtab-search"));
	({ Searchbar } = await import("./widgets/searchbar"));
});

const latestSearchDialogProps = () => {
	const props = mockSearchDialog.mock.calls.at(-1)?.[0];
	if (!props) throw new Error("New Tab search dialog was not rendered");

	return props as SearchDialogProps;
};

const latestCommandToggle = () => {
	const onToggle = mockUseToggleSearchCommand.mock.calls.at(-1)?.[0];
	if (!onToggle) throw new Error("New Tab command listener was not registered");

	return onToggle as () => void;
};

beforeEach(() => {
	mockSearchDialog.mockClear();
	mockNewtabWidget.mockClear();
	mockUseToggleSearchCommand.mockClear();
	mockUseSettings.mockClear();
	mockCommandShortcut = "Ctrl+Shift+Space";
});

afterEach(cleanup);

describe("NewtabSearchProvider", () => {
	test("keeps command search mounted when the widget layout omits searchbar", () => {
		render(<Homepage />);

		expect(
			mockNewtabWidget.mock.calls.map(
				([props]) => (props as { id?: string }).id,
			),
		).toEqual(["bookmarks"]);
		expect(mockSearchDialog).toHaveBeenCalledTimes(1);
		expect(latestSearchDialogProps()).toMatchObject({
			open: false,
		});

		act(() => latestCommandToggle()());
		expect(latestSearchDialogProps().open).toBe(true);
	});

	test("shares one dialog between the browser command and searchbar trigger", () => {
		render(
			<NewtabSearchProvider>
				<Searchbar />
			</NewtabSearchProvider>,
		);

		expect(mockSearchDialog).toHaveBeenCalledTimes(1);
		const trigger = screen.getByRole("textbox", { name: "Open search" });
		expect(trigger.getAttribute("aria-expanded")).toBe("false");
		expect(screen.getByText("Ctrl+Shift+Space")).not.toBeNull();

		fireEvent.click(trigger);
		expect(latestSearchDialogProps().open).toBe(true);
		expect(trigger.getAttribute("aria-expanded")).toBe("true");

		act(() => latestSearchDialogProps().onOpenChange(false));
		fireEvent.keyDown(trigger, { key: " " });
		expect(latestSearchDialogProps().open).toBe(true);
	});

	test("shows a clear state when the browser command is unassigned", () => {
		mockCommandShortcut = null;
		render(
			<NewtabSearchProvider>
				<Searchbar />
			</NewtabSearchProvider>,
		);

		expect(screen.getByText("Unassigned")).not.toBeNull();
	});
});
