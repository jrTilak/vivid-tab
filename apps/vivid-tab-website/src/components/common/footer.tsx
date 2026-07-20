import { PORTFOLIO } from "@/constants";
import Link from "next/link";

const navigation = {
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-background border-t mt-20 sm:mt-24">
      <div className="container px-6 lg:px-8 flex flex-col items-center justify-center gap-2 py-6">
        <nav className="text-center" aria-label="Legal">
          {navigation.legal.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm leading-6 text-muted-foreground hover:text-foreground mx-2"
            >
              {item.name}
            </Link>
          ))}
        </nav>
        <p className="text-center text-xs leading-5 text-muted-foreground">
          &copy; {new Date().getFullYear()} <Link href={PORTFOLIO} target="_blank" className="text-destructive underline">
            @jrTilak
          </Link>
        </p>
      </div>
    </footer>
  );
}
