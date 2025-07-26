import { Card, CardContent } from "@/components/ui/card"
import React from "react"
import { GithubIcon } from "lucide-react"

const Support = () => {
  return (
    <div className="p-4 grid grid-cols-2 gap-4">
      {[
        {
          title: "Github",
          url: "https://github.com/jrtilak/vivid-tab",
          icon: <GithubIcon />,
          desc: "Contribute on Github",
        },
      ].map((item, i) => (
        <Card
          key={i}
          className="overflow-hidden transition-all bg-muted hover:scale-[1.01] border-solid border shadow-none"
        >
          <a
            href={item.url}
            className="block"
            target="_blank"
            rel="noopener noreferrer"
          >
            <CardContent className="flex items-center justify-between p-6">
              <div className="space-y-1">
                <h3 className="font-medium leading-none tracking-tight text-xl text-foreground">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
              <div className="ml-4 flex-shrink-0 text-foreground/60">
                {typeof item.icon === "string" ? (
                  <img
                    src={item.icon}
                    alt={item.title}
                    className="rounded-md size-6"
                  />
                ) : (
                  item.icon
                )}
              </div>
            </CardContent>
          </a>
        </Card>
      ))}
    </div>
  )
}

export default Support
