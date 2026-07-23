import audioFileIconUrl from "raw:/assets/svg/audio-file.svg";
import docFileIconUrl from "raw:/assets/svg/doc-document-docx.svg";
import genericFileIconUrl from "raw:/assets/svg/file.svg";
import imageFileIconUrl from "raw:/assets/svg/image.svg";
import localDirectoryIconUrl from "raw:/assets/svg/local-directory.svg";
import pdfFileIconUrl from "raw:/assets/svg/pdf-file.svg";
import presentationFileIconUrl from "raw:/assets/svg/ppt.svg";
import svgFileIconUrl from "raw:/assets/svg/svg.svg";
import videoFileIconUrl from "raw:/assets/svg/video-file.svg";
import spreadsheetFileIconUrl from "raw:/assets/svg/xls.svg";

/**
 * Maps local-file bookmarks to packaged type icons without touching web URLs.
 * A trailing slash identifies a local directory; unknown, extensionless, and
 * malformed file URLs use a normal generic-file icon.
 *
 * @example
 * ```ts
 * getFileIcon("file:///home/user/report.pdf");
 * // chrome-extension://.../pdf-file.<hash>.svg
 * ```
 *
 * @param fileUrl - Bookmark URL to inspect.
 * @returns A packaged icon URL for local files, otherwise `null`.
 */
export const getFileIcon = (fileUrl: string): string | null => {
	if (!/^file:\/\//i.test(fileUrl)) return null;

	let filename = "";

	try {
		const pathname = decodeURIComponent(new URL(fileUrl).pathname);
		if (pathname.endsWith("/")) return localDirectoryIconUrl;

		filename = pathname.split("/").at(-1) ?? "";
	} catch {
		return genericFileIconUrl;
	}

	const dotIndex = filename.lastIndexOf(".");
	const fileExtension =
		dotIndex > 0 ? filename.slice(dotIndex + 1).toLowerCase() : "";

	switch (fileExtension) {
		case "pdf":
			return pdfFileIconUrl;
		case "doc":
		case "docx":
		case "odt":
		case "rtf":
			return docFileIconUrl;
		case "csv":
		case "ods":
		case "xls":
		case "xlsx":
			return spreadsheetFileIconUrl;
		case "odp":
		case "ppt":
		case "pptx":
			return presentationFileIconUrl;
		case "avif":
		case "jpg":
		case "jpeg":
		case "png":
		case "gif":
		case "bmp":
		case "ico":
		case "tif":
		case "tiff":
		case "webp":
			return imageFileIconUrl;
		case "svg":
			return svgFileIconUrl;
		case "mp3":
		case "wav":
		case "aac":
		case "flac":
		case "m4a":
		case "ogg":
		case "opus":
			return audioFileIconUrl;
		case "mp4":
		case "avi":
		case "m4v":
		case "mkv":
		case "mov":
		case "webm":
			return videoFileIconUrl;
		default:
			return genericFileIconUrl;
	}
};
