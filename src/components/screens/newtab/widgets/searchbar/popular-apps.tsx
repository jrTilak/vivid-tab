import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { LayoutGridIcon } from "lucide-react"
import { useSettings } from "@/providers/settings-provider"

import x from "data-base64:@/assets/x.png"
import xLight from "data-base64:@/assets/x-twitter-light.png"
import chatgpt from "data-base64:@/assets/openai.png"
import notionLight from "data-base64:@/assets/notion-light.png"
import notionDark from "data-base64:@/assets/svg/notion.svg"
import whatsapp from "data-base64:@/assets/svg/whatsapp-color.svg"
import linkedin from "data-base64:@/assets/svg//linkedin-color.svg"
import gmail from "data-base64:@/assets/svg/gmail.svg"
import youtube from "data-base64:@/assets/svg/youtube-color.svg"
import drive from "data-base64:@/assets/svg/drive-color.svg"
import maps from "data-base64:@/assets/svg/maps-gps.svg"
import news from "data-base64:@/assets/svg/news.svg"
import pinterest from "data-base64:@/assets/svg/pinterest-color.svg"

const POPULAR_APPS = [
  {
    title: "ChatGPT",
    url: "https://chatgpt.com/",
    icon: chatgpt,
  },
  {
    title: "Notion",
    url: "https://www.notion.so/",
    icon: {
      dark: notionLight,
      light: notionDark,
    },
  },
  {
    title: "X (Twitter)",
    url: "https://x.com",
    icon: {
      dark: xLight,
      light: x,
    },
  },
  {
    title: "Whatsapp",
    url: "https://web.whatsapp.com/",
    icon: whatsapp,
  },
  {
    title: "Linkedin",
    url: "https://www.linkedin.com/",
    icon: linkedin,
  },
  {
    title: "Gmail",
    url: "https://mail.google.com/mail/",
    icon: gmail,
  },
  {
    title: "Youtube",
    url: "https://www.youtube.com/",
    icon: youtube,
  },
  {
    title: "Drive",
    url: "https://drive.google.com/",
    icon: drive,
  },
  {
    title: "Maps",
    url: "https://maps.google.com/",
    icon: maps,
  },
  {
    title: "News",
    url: "https://news.google.com/",
    icon: news,
  },
  {
    title: "Pinterest",
    url: "https://www.pinterest.com/",
    icon: pinterest,
  },
]

export function PopularApps() {
  const { settings } = useSettings()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          tabIndex={-1}
          variant="none"
          size="icon"
          className="w-auto aspect-square hover:scale-105 transition-transform [&_svg]:size-6 text-background dark:text-foreground "
        >
          <LayoutGridIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 shadow-xl">
        <div className="grid gap-4 grid-cols-3">
          {POPULAR_APPS.map((app, i) => (
            <Button
              key={i}
              asChild
              variant="secondary"
              className="h-fit focus-visible:ring-destructive bg-secondary/30 border border-border/10"
            >
              <a
                href={app.url}
                target={
                  settings.general.openUrlIn === "current-tab"
                    ? "_self"
                    : "_blank"
                }
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1 text-center"
              >
                {typeof app.icon === "string" ? (
                  <img
                    src={app.icon}
                    alt={app.title}
                    className="size-12 rounded-lg"
                  />
                ) : (
                  <>
                    <img
                      src={app.icon.light}
                      alt={app.title}
                      className="size-12 dark:hidden rounded-lg"
                    />
                    <img
                      src={app.icon.dark}
                      alt={app.title}
                      className="size-12 hidden dark:block rounded-lg"
                    />
                  </>
                )}
                <p className="text-xs text-foreground">{app.title}</p>
              </a>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
