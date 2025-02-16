import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { fetchFavicon } from "@/helpers/fetch-favicon"
import { useSettings } from "@/providers/settings-provider"
import type { BookmarkUrlNode } from "@/types/bookmark-types"
import React, { useEffect } from "react"

type Props = BookmarkUrlNode & {
  layout: "grid" | "list"
}

const BookmarkUrl = (props: Props) => {
  const { settings: { general } } = useSettings()
  const [data, setData] = React.useState({
    title: props.title,
    image: ""
  })

  useEffect(() => {
    const fn = async () => {
      const cachedData = await new Promise<{ favicon: string | null; expiry: number | null }>((resolve) => {
        chrome.storage.local.get([`favicon-${props.url}`], (result) => {
          resolve(result[`favicon-${props.url}`] || { favicon: null, expiry: null });
        });
      });

      const currentTime = Date.now();
      if (cachedData.favicon && cachedData.expiry && cachedData.expiry > currentTime) {
        // Use cached favicon if it hasn't expired
        setData({
          image: cachedData.favicon,
          title: props.title
        });
      } else {
        // Fetch new favicon
        const res = await fetchFavicon(props.url || "");
        const faviconUrl = res.favicon;

        // Convert the favicon URL to Base64
        const response = await fetch(faviconUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setData({
            image: base64data,
            title: props.title
          });
          // Set the favicon with an expiration of 1 day (86400000 milliseconds)
          const expiryTime = currentTime + 86400000; // 1 day in milliseconds
          chrome.storage.local.set({ [`favicon-${props.url}`]: { favicon: base64data, expiry: expiryTime } });
        };
        reader.readAsDataURL(blob);
      }
    }

    fn();
  }, [props.url]);

  if (props.layout === "grid") {
    return (
      <a
        href={props.url}
        target={general.openUrlIn === "new-tab" ? "_blank" : "_self"}
        className="flex items-center flex-col space-y-1 p-2 rounded-lg hover:scale-105 transition-transform text-center text-xs w-24">
        <Avatar className="rounded-none mx-auto">
          <AvatarImage
            src={data.image}
            alt={props.title}
            className="rounded-md object-contain object-center size-12"
          />
          <AvatarFallback className="size-12">
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
        <p className="text-center line-clamp-2 text-xs break-all">{data.title}</p>
      </a>
    )
  } else {
    return (
      <a
        href={props.url}
        target={general.openUrlIn === "new-tab" ? "_blank" : "_self"}
        className="flex items-center space-x-2 p-2 rounded-lg transition-colors hover:bg-accent/10">
        <Avatar className="rounded-none">
          <AvatarImage
            src={data.image}
            alt={props.title}
            className="rounded-md object-contain object-center size-12"
          />
          <AvatarFallback className="size-12">
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
          <span className="text-xs truncate">{props.url}</span>
        </p>
      </a>
    )
  }
}

export default BookmarkUrl
