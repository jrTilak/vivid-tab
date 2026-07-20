import { buttonVariants } from "@/components/ui/button";
import { GITHUB } from "@/constants";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "What's New | Vivid Tab: A new tab, a new vibe.",
};

export default function WhatsNewPage() {
  return (
    <div className="min-h-screen flex justify-center">
      <div className="max-w-3xl w-full px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 underline">What&apos;s New</h1>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Version 1.3.0 – May 26, 2026</h2>

          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>Bug fixes</li>
            <li>Refactor</li>
            <li>Performance improvements</li>
          </ul>
        </section>

        <div className="mt-10">
          <Link
            target="_blank"
            href={GITHUB + "/blob/master/CHANGELOG.md"}
            className={buttonVariants()}
          >
            📜 See all changelogs
          </Link>
        </div>

        <div className="border-t border-gray-700 mt-12" />
      </div>
    </div>
  );
}
