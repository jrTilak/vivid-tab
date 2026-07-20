import { MAIL } from "@/constants"
import { Metadata } from "next";
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy | Vivid Tab: A new tab, a new vibe.",
};

export default function PolicyPage() {
  return (
    <div className="min-h-screen  flex justify-center">
      <div className="max-w-3xl w-full px-4 py-12">

        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-3xl font-bold mb-6 underline">Privacy Policy</h1>
          <span className="no-underline mb-4 text-sm sm:text-lg">(Last updated: 7/26/2025)</span>
        </div>

        <p className="mb-8">
          At <span className="font-semibold">Vivid Tab</span>, your privacy is our priority. We do not collect or use your personal data. Here&apos;s what we
          access and why:
        </p>

        <h2 className="text-xl font-semibold mb-4">Permissions We Access:</h2>

        <ul className="list-disc pl-6 space-y-3 mb-8">
          <li>
            <span className="font-semibold">Location (optional):</span> We access your location to provide relevant weather updates based on your region. You can disable this permission if you prefer not to share your location.
          </li>
          <li>
            <span className="font-semibold">History (optional, readonly):</span> We access your browsing history to display quick links to sites you&apos;ve visited, enhancing
            your browsing experience. You can disable this permission if you prefer not to show your browsing history in quick links.
          </li>
          <li>
            <span className="font-semibold">Bookmarks (required):</span> We access your bookmarks to allow you to add and display shortcuts for easy access. This extensions core features rely on this permission, so bookmark access is required.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mb-4">No Data Collection or Sharing</h2>

        <p className="mb-8">
          We do not collect, store, or send any data to external servers. All the data (location, history, and
          bookmarks) is kept locally on your device. We are committed to your privacy and ensure that
          everything you interact with remains private.
        </p>

        <h2 className="text-xl font-semibold mb-4">Security</h2>

        <p className="mb-8">
          Since all data is stored locally, your information is not shared with anyone. Your data stays private and
          secure on your device at all times.
        </p>

        <h2 className="text-xl font-semibold mb-4">Updates</h2>

        <p className="mb-6">
          This privacy policy may change as we continue to improve the extension. Any updates will be posted
          here.
        </p>

        <p className="mb-8">
          If you have any questions or concerns, feel free to contact at{" "}
          <Link href={`mailto:${MAIL}`} className="text-destructive hover:underline">
            {MAIL}
          </Link>.
        </p>

        <div className="border-t border-gray-700 mt-8" />
      </div>
    </div>
  )
}
