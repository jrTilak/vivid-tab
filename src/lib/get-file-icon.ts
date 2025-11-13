import pdf from "data-base64:@/assets/svg/pdf-file.svg"
import doc from "data-base64:@/assets/svg/doc-document-docx.svg"
import xls from "data-base64:@/assets/svg/xls.svg"
import ppt from "data-base64:@/assets/svg/ppt.svg"
import image from "data-base64:@/assets/svg/image.svg"
import svg from "data-base64:@/assets/svg/svg.svg"
import audio from "data-base64:@/assets/svg/audio-file.svg"
import video from "data-base64:@/assets/svg/video-file.svg"
import fileBroken from "data-base64:@/assets/svg/file-broken.svg"

export const getFileIcon = (fileUrl: string) => {
  if (!fileUrl.startsWith("file://")) {
    return null
  }

  const fileExtension = new URL(fileUrl).pathname
    .split(".")
    .pop()
    ?.toLowerCase()

  switch (fileExtension) {
    case "pdf":
      return pdf
    case "doc":
    case "docx":
      return doc
    case "xls":
    case "xlsx":
      return xls
    case "ppt":
    case "pptx":
      return ppt
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "bmp":
      return image
    case "svg":
      return svg
    case "mp3":
    case "wav":
    case "aac":
    case "flac":
      return audio
    case "mp4":
    case "avi":
      return video
    default:
      return fileBroken
  }
}
