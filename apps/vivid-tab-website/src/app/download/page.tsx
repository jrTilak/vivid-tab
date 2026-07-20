"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import Link from "next/link";
import { getBrowser } from "@/lib/browser";

export default function DownloadPage() {
  const [browser, setBrowser] = useState<"chrome" | "firefox" | "other">(
    "other"
  );

  useEffect(() => {
    const b = getBrowser();
    setBrowser(b);
  }, []);

  const downloadLinks = {
    chrome: process.env.NEXT_PUBLIC_CHROME_WEBSTORE_URL as string,
    firefox: process.env.NEXT_PUBLIC_FIREFOX_ADDON_URL as string,
    source: process.env.NEXT_PUBLIC_GITHUB_URL as string,
  };

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
      <div className="max-w-3xl space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            Get Vivid Tab
          </h1>
          <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Transform your new tab experience. Available for Chrome, Firefox
            based browsers.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          {browser === "firefox" ? (
            <Button size="lg" className="px-8 text-lg" asChild>
              <Link href={downloadLinks.firefox} target="_blank">
                <img src="/firefox.svg" className="h-5 w-5" />
                Download for Firefox
              </Link>
            </Button>
          ) : (
            <Button
              size="lg"
              variant={"outline"}
              className="px-8 text-lg"
              asChild
            >
              <Link href={downloadLinks.chrome} target="_blank">
                <img src="/chrome.svg" className="h-5 w-5" />
                Download for Chrome
              </Link>
            </Button>
          )}

          {/* Secondary Options */}
          <div className="grid gap-4 sm:grid-cols-2">
            {browser === "chrome" ? (
              <Button variant="outline" asChild>
                <Link href={downloadLinks.firefox} target="_blank">
                  <img src="/firefox.svg" className="h-5 w-5" />
                  Download for Firefox
                </Link>
              </Button>
            ) : (
              <Button variant="outline" asChild>
                <Link href={downloadLinks.chrome} target="_blank">
                  <img src="/chrome.svg" className="h-5 w-5" />
                  Download for Chrome
                </Link>
              </Button>
            )}

            <Button variant="outline" asChild>
              <Link href={downloadLinks.source} target="_blank">
                <Github className="mr-2 h-4 w-4" />
                Build from Source
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

