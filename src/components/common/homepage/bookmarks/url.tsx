import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { fetchTitleAndFavicon } from "@/helpers/fetch-title-and-favicon"
import type { BookmarkUrlNode } from "@/types/bookmark-types"
import React, { useEffect } from "react"

type Props = BookmarkUrlNode & {
  layout: "grid" | "list"
}

const BookmarkUrl = (props: Props) => {
  const [data, setData] = React.useState({
    title: props.title,
    image: ""
  })

  useEffect(() => {
    const fn = async () => {
      const res = await fetchTitleAndFavicon(props.url || "")
      setData({
        image: res.favicon,
        title: res.title || props.title
      })
    }
    fn()
  }, [props.url])

  if (props.layout === "grid") {
    return (
      <a
        href={props.url}
        className="flex items-center flex-col space-x-2 p-2 rounded-lg hover:scale-105 transition-transform text-center truncate">
        <Avatar>
          <AvatarImage
            src={data.image}
            alt={props.title}
            className="rounded-none object-contain object-center"
          />
          <AvatarFallback>
            {data.title
              .replace(/[^a-zA-Z ]/g, "")
              .trim()
              .toLowerCase()
              .split(" ")
              .map((word) => word[0]?.toUpperCase())
              .join("")
              .substring(0, 2)}
          </AvatarFallback>
        </Avatar>
        <p>{data.title.substring(0, 8)}</p>
      </a>
    )
  } else {
    return (
      <a
        href={props.url}
        className="flex items-center space-x-2 p-2 rounded-lg  transition-colors">
        <Avatar>
          <AvatarImage
            src={data.image}
            alt={props.title}
            className="rounded-none object-contain object-center"
          />
          <AvatarFallback>
            {data.title
              .replace(/[^a-zA-Z ]/g, "")
              .trim()
              .toLowerCase()
              .split(" ")
              .map((word) => word[0]?.toUpperCase())
              .join("")
              .substring(0, 2)}
          </AvatarFallback>
        </Avatar>
        <p className="truncate flex flex-col gap-1">
          <span> {data.title}</span>
          <span className="text-xs text-gray-400 truncate">{props.url}</span>
        </p>
      </a>
    )
  }
}

export default BookmarkUrl
