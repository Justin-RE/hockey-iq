import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { UserNav } from "@/components/UserNav";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "HockeyIQ", template: "%s | HockeyIQ" },
  description: "Learn field hockey decisions by playing through real game situations.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded focus:bg-white focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <header className="bg-turf-dark text-white">
          <nav
            aria-label="Main"
            className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3"
          >
            <Link href="/" className="text-lg font-bold tracking-tight">
              Hockey<span className="text-you">IQ</span>
            </Link>
            <Link href="/play" className="hover:underline">
              Play
            </Link>
            <Link href="/progress" className="hover:underline">
              My progress
            </Link>
            <div className="ml-auto text-sm">
              <Suspense fallback={<span aria-hidden>&nbsp;</span>}>
                <UserNav />
              </Suspense>
            </div>
          </nav>
        </header>
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-600">
          <Link href="/privacy" className="underline">
            Privacy
          </Link>
          <span className="mx-2" aria-hidden>
            ·
          </span>
          Built for players, coaches, and parents learning the game.
        </footer>
      </body>
    </html>
  );
}
