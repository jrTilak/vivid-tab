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
      return chrome.runtime.getURL("assets/svg/pdf-file.svg")
    case "doc":
    case "docx":
      return chrome.runtime.getURL("assets/svg/doc-document-docx.svg")
    case "xls":
    case "xlsx":
      return chrome.runtime.getURL("assets/svg/xls.svg")
    case "ppt":
    case "pptx":
      return chrome.runtime.getURL("assets/svg/ppt.svg")
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "bmp":
      return chrome.runtime.getURL("assets/svg/image.svg")
    case "svg":
      return chrome.runtime.getURL("assets/svg/svg.svg")
    case "mp3":
    case "wav":
    case "aac":
    case "flac":
      return chrome.runtime.getURL("assets/svg/audio-file.svg")
    case "mp4":
    case "avi":
      return chrome.runtime.getURL("assets/svg/video-file.svg")
    default:
      return chrome.runtime.getURL("assets/svg/file-broken.svg")
  }
}

