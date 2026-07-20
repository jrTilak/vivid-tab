import { MAIL } from "@/constants"
import { Metadata } from "next";
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms of Service | Vivid Tab: A new tab, a new vibe.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen  flex justify-center">
      <div className="max-w-3xl w-full px-4 py-12">

        <h1 className="text-3xl font-bold mb-8 underline">Terms of Service</h1>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p>
            By using <span className="font-semibold">Vivid Tab</span>, you agree to these terms. If you don&apos;t agree,  please refrain from using the extension.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">2. License</h2>
          <p>
            Vivid Tab is an open-source project. You are free to fork, modify, and use the code for personal or
            non-commercial purposes, with proper attribution to the original creator.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">3. Permissions</h2>
          <p className="mb-4">The extension requires access to:</p>
          <ul className="list-disc pl-6 space-y-3">
            <li>
              <span className="font-semibold">Location (optional):</span> To provide weather updates based on your region.
            </li>
            <li>
              <span className="font-semibold">History (optional):</span> To display visited websites for quick access.
            </li>
            <li>
              <span className="font-semibold">Bookmarks (required):</span> To show your saved bookmarks as shortcuts.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">4. Privacy</h2>
          <p>
            We do not collect or send your data anywhere. All data (location, history, bookmarks) is stored locally on
            your device.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">5. Liability</h2>
          <p>
            We are not liable for any issues that may arise from modifying or misusing the extension. Please use it responsibly.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">6. Contact Us</h2>
          <p>
            For any questions, feel free to contact at{" "}
            <Link href={`mailto:${MAIL}`} className="text-destructive hover:underline">
              {MAIL}
            </Link>.
            .
          </p>
        </section>

        <div className="border-t border-gray-700 mt-8" />
      </div>
    </div>
  )
}

