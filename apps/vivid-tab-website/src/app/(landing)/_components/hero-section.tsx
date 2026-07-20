import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { GITHUB } from "@/constants";
import { ArrowRightIcon, GithubIcon } from "lucide-react";
import HeroVideoDialog from "./hero-video-dialog";

export default function HeroSection() {
  return (
    <div className="relative isolate overflow-hidden bg-background">
      <svg
        className="absolute inset-0 -z-10 h-full w-full stroke-gray-200 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
        aria-hidden="true"
        suppressHydrationWarning
      >
        <defs>
          <pattern
            id="0787a7c5-978c-4f66-83c7-11c213f99cb7"
            width={200}
            height={200}
            x="50%"
            y={-1}
            patternUnits="userSpaceOnUse"
          >
            <path d="M.5 200V.5H200" fill="none" />
          </pattern>
        </defs>
        <rect
          width="100%"
          height="100%"
          strokeWidth={0}
          fill="url(#0787a7c5-978c-4f66-83c7-11c213f99cb7)"
        />
      </svg>
      <div className="container px-6  pt-10 lg:flex lg:px-8 lg:pt-40">
        <div className="max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0 lg:pt-8">
          <div>
            <div className="mt-12 sm:mt-24 lg:mt-16">
              <Link href={"/whats-new"} className="inline-flex space-x-6 ">
                <Badge variant={"outline"}>🚀 New Release v1.3.0</Badge>
              </Link>
            </div>
            <h1 className="mt-10 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Vivid Tab: A new tab, <br />a{" "}
              <span className="text-destructive">new</span> vibe.
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Customize your new tab with bookmarks, weather, to-dos, and more
              for a vibrant, productive browsing experience.
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <Button asChild size="lg">
                <Link href={"/download"}>
                  Get it now! <ArrowRightIcon size={24} />
                </Link>
              </Button>
              <Button variant={"outline"} asChild size="lg">
                <Link href={GITHUB} target="_blank">
                  Github <GithubIcon />
                </Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-16 flex sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-32">
          <HeroVideoDialog />
        </div>
      </div>
    </div>
  );
}
