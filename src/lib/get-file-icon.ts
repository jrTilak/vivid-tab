export const getFileIcon = (fileUrl: string) => {
  if (!fileUrl.startsWith("file://")) {
    return null
  }

  const fileExtension = fileUrl.split(".").pop()

  switch (fileExtension) {
    case "pdf":
      return "https://www.svgrepo.com/show/484943/pdf-file.svg"
    case "doc":
    case "docx":
      return "https://www.svgrepo.com/show/429508/doc-document-docx.svg"
    case "xls":
    case "xlsx":
      return "https://www.svgrepo.com/show/255829/xls.svg"
    case "ppt":
    case "pptx":
      return "https://www.svgrepo.com/show/146106/ppt.svg"
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "bmp":
      return "https://www.svgrepo.com/show/449585/image.svg"
    case "svg":
      return "https://www.svgrepo.com/show/438994/svg.svg"
    case "mp3":
    case "wav":
    case "aac":
    case "flac":
      return "https://www.svgrepo.com/show/227610/audio-file.svg"
    case "mp4":
    case "avi":
      return "https://www.svgrepo.com/show/227622/video-file.svg"
    default:
      return "https://www.svgrepo.com/show/211061/file-broken.svg"
  }
}
