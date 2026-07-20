"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";

import Image from "next/image";
import { cn } from "@/lib/utils";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useEffect, useState } from "react";
import { MenuIcon } from "lucide-react";
import { CONTACT_LINK } from "@/constants";
import { getBrowser } from "@/lib/browser";

const NAV_ITEMS: {
  label: string;
  href: string;
  external?: boolean;
}[] = [
  { label: "Home", href: "/" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Contact Us", href: CONTACT_LINK, external: true },
] as const;

export default function Header() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [browser, setBrowser] = useState<"chrome" | "firefox" | "other">(
    "other"
  );

  useEffect(() => {
    const b = getBrowser();
    setBrowser(b);
  }, []);

  const getDownloadButton = () => {
    if (browser === "firefox") {
      return (
        <Link
          href={process.env.NEXT_PUBLIC_FIREFOX_ADDON_URL as string}
          target="_blank"
          className={buttonVariants({ variant: "secondary" })}
        >
          <Image
            src="/firefox.svg"
            alt="Firefox Addon Store"
            width={24}
            height={24}
          />
          Download Now
        </Link>
      );
    }
    return (
      <Link
        href={process.env.NEXT_PUBLIC_CHROME_WEBSTORE_URL as string}
        target="_blank"
        className={buttonVariants({ variant: "secondary" })}
      >
        <Image
          src="/chrome.svg"
          alt="Firefox Addon Store"
          width={24}
          height={24}
        />
        Download Now
      </Link>
    );
  };
  return (
    <header className="sticky top-0 w-full border-b bg-background z-50">
      <nav className="container flex h-14 items-center">
        {/* Logo */}
        <Link href="/" className="mr-8 flex items-center space-x-2">
          <Image src="/icon.png" alt="Vivid Tab" width={30} height={30} />
          <span className="text-xl font-bold">Vivid Tab</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:flex-1">
          <ul className="flex flex-1 items-center justify-center space-x-8">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    `text-sm font-medium transition-colors hover:text-primary`,
                    pathname === item.href
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                  )}
                  target={item.external ? "_blank" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Download Button (Desktop) */}
        <div className="hidden md:flex gap-4 items-center justify-center">
          {getDownloadButton()}
        </div>

        <div className="flex flex-1 justify-end md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <div className="flex gap-2 items-center justify-center">
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <MenuIcon className="size-8" />
                </Button>
              </SheetTrigger>
            </div>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Vivid Tab</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2 py-6 h-full">
                {NAV_ITEMS.map((item) => (
                  <div key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        `flex w-full items-center py-2 text-lg font-medium`,
                        pathname === item.href
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                      target={item.external ? "_blank" : undefined}
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </div>
                ))}
                <div className="mt-auto w-full">{getDownloadButton()}</div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
