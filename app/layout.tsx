import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { AUTH_COOKIE_NAME } from "@/lib/constants";
import LogoutButton from "@/components/LogoutButton";

export const metadata: Metadata = {
  title: "SeraStay Hotels",
  description: "Find and book great hotel stays across India with SeraStay.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
        <header className="sticky top-0 z-10 border-b bg-white shadow-sm">
          <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-indigo-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <path d="M3 21V9.5a1 1 0 0 1 .4-.8l8-6a1 1 0 0 1 1.2 0l8 6a1 1 0 0 1 .4.8V21a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-5H10v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
              </svg>
              <span className="text-lg">SeraStay</span>
            </Link>
            <nav className="flex items-center gap-5 text-sm">
              <Link href="/" className="text-slate-600 hover:text-indigo-600">
                Home
              </Link>
              {session ? (
                <>
                  <Link href="/bookings" className="text-slate-600 hover:text-indigo-600">
                    My Bookings
                  </Link>
                  <span className="hidden text-slate-400 sm:inline">{session.mobile}</span>
                  <LogoutButton />
                </>
              ) : (
                <Link
                  href="/login"
                  className="rounded-full bg-indigo-600 px-4 py-1.5 font-medium text-white hover:bg-indigo-700"
                >
                  Login
                </Link>
              )}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 p-4">{children}</main>
        <footer className="border-t bg-white">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 p-4 text-xs text-slate-500 sm:flex-row">
            <span>© 2026 SeraStay Hotels. All rights reserved.</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-indigo-600">
                Privacy
              </a>
              <a href="#" className="hover:text-indigo-600">
                Terms
              </a>
              <a href="#" className="hover:text-indigo-600">
                Contact
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
