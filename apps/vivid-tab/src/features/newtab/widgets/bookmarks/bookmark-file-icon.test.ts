import { describe, expect, test } from "@test/jest";
import { getFileIcon } from "./bookmark-file-icon";

describe("getFileIcon", () => {
	test("returns null for non-local bookmarks", () => {
		expect(getFileIcon("https://example.com/report.pdf")).toBeNull();
		expect(getFileIcon("chrome://extensions/")).toBeNull();
	});

	test.each([
		["file:///tmp/report.PDF", "pdf-file.svg"],
		["file:///tmp/report%2Epdf", "pdf-file.svg"],
		["file:///tmp/report.docx", "doc-document-docx.svg"],
		["file:///tmp/report.odt", "doc-document-docx.svg"],
		["file:///tmp/sheet.xlsx", "xls.svg"],
		["file:///tmp/sheet.csv", "xls.svg"],
		["file:///tmp/slides.pptx", "ppt.svg"],
		["file:///tmp/slides.odp", "ppt.svg"],
		["file:///tmp/photo.webp", "image.svg"],
		["file:///tmp/vector.svg", "svg.svg"],
		["file:///tmp/song.opus", "audio-file.svg"],
		["file:///tmp/movie.webm", "video-file.svg"],
	])("maps %s to the packaged %s asset", (url, filename) => {
		expect(getFileIcon(url)).toContain(filename);
	});

	test("uses a distinct icon for local directories", () => {
		const unixDirectory = getFileIcon("file:///tmp/Documents/");
		const windowsDirectory = getFileIcon("file:///C:/Users/example/");

		expect(unixDirectory).toContain("local-directory.svg");
		expect(windowsDirectory).toBe(unixDirectory);
		expect(unixDirectory).not.toContain("folder-svgrepo-com.png");
	});

	test.each([
		"file://%invalid",
		"file:///tmp/README",
		"file:///tmp/.config",
		"file:///tmp/archive.zip",
	])("uses the generic file icon for %s", (url) => {
		expect(getFileIcon(url)).toContain("file.svg");
	});

	test("matches the file protocol and extension case-insensitively", () => {
		expect(getFileIcon("FILE:///tmp/report.PDF")).toContain("pdf-file.svg");
	});
});
