import { Metadata } from "next";
import "./globals.css";
import Header from "@/components/common/header";
import Footer from "@/components/common/footer";


export const metadata: Metadata = {
  title: "Vivid Tab: A new tab, a new vibe.",
  description: "Customize your new tab with bookmarks, weather, to-dos, and more for a vibrant, productive browsing experience.",
  keywords: ["new tab", "productivity", "bookmarks", "weather", "to-dos", "chrome extension", "vivid tab", "jrtilak"],
  authors: [
    {
      name: "jrTilak",
      url: "https://www.jrtilak.dev",
    }
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://vividtab.jrtilak.dev",
    siteName: "Vivid Tab",
    title: "Vivid Tab: A new tab, a new vibe.",
    description: "Customize your new tab with bookmarks, weather, to-dos, and more for a vibrant, productive browsing experience.",
    images: [
      {
        url: "/preview.png",
        width: 1200,
        height: 630,
        alt: "Vivid Tab Preview",
      }
    ]
  },
  icons: [
    {
      url: "/icon.png",
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}