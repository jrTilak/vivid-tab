import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { LayoutGridIcon } from "lucide-react"
import buyMeACoffee from "data-base64:@/assets/Buy Me a Coffee Icon.svg"
import buyMeACoffeeDark from "data-base64:@/assets/bmc-logo-yellow.png"
import x from "data-base64:@/assets/x.svg"
import xLight from "data-base64:@/assets/x-twitter-light.png"
import chatgpt from "data-base64:@/assets/openai.svg"
import notionLight from "data-base64:@/assets/notion-light.svg"
import { useSettings } from "@/providers/settings-provider"

const POPULAR_APPS = [
  {
    title: "Support",
    url: "https://buymeacoffee.com/jrtilak",
    icon: {
      light: buyMeACoffee,
      dark: buyMeACoffeeDark,
    },
  },
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
      light: "https://www.svgrepo.com/show/504667/notion.svg"
    },
  },
  {
    title: "X (Twitter)",
    url: "https://x.com",
    icon: {
      dark: xLight,
      light: x
    },
  }, {
    title: "Whatsapp",
    url: "https://web.whatsapp.com/",
    icon: "https://www.svgrepo.com/show/475692/whatsapp-color.svg",
  }, {
    title: "Linkedin",
    url: "https://www.linkedin.com/",
    icon: "https://www.svgrepo.com/show/475661/linkedin-color.svg",
  },
  {
    title: "Gmail",
    url: "https://mail.google.com/mail/",
    icon: "https://www.svgrepo.com/show/223047/gmail.svg",
  },
  {
    title: "Youtube",
    url: "https://www.youtube.com/",
    icon: "https://www.svgrepo.com/show/475700/youtube-color.svg",
  }, {
    title: "Drive",
    url: "https://drive.google.com/",
    icon: "https://www.svgrepo.com/show/475644/drive-color.svg",
  }, {
    title: "Maps",
    url: "https://maps.google.com/",
    icon: "https://www.svgrepo.com/show/223049/maps-gps.svg",
  }, {
    title: "News",
    url: "https://news.google.com/",
    icon: "https://www.svgrepo.com/show/223048/news.svg",
  },
  {
    title: "Pinterest",
    url: "https://www.pinterest.com/",
    icon: "https://www.svgrepo.com/show/475670/pinterest-color.svg",
  },
]

export function PopularApps() {
  const { settings } = useSettings()

  return (
    <Popover>
      <PopoverTrigger asChild >
        <Button tabIndex={-1} variant="none" size="icon" className="w-auto aspect-square hover:scale-105 transition-transform [&_svg]:size-6 text-background dark:text-foreground">
          <LayoutGridIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4 grid-cols-3">
          {
            POPULAR_APPS.map((app, i) => (
              <Button key={i} asChild variant="secondary" className="h-fit focus-visible:ring-destructive">
                <a href={app.url} target={settings.general.openUrlIn === "current-tab" ? "_self" : "_blank"} rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-1 text-center"
                >
                  {typeof app.icon === "string" ?
                    <img src={app.icon} alt={app.title} className="size-12 rounded-lg" />
                    :
                    <>
                      <img src={app.icon.light} alt={app.title} className="size-12 dark:hidden rounded-lg" />
                      <img src={app.icon.dark} alt={app.title} className="size-12 hidden dark:block rounded-lg" />
                    </>
                  }
                  <p className="text-xs text-muted-foreground">{app.title}</p>
                </a>
              </Button>
            ))
          }
        </div>
      </PopoverContent>
    </Popover>
  )
}
