import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { AUTH_COOKIE_NAME } from "@/lib/constants";
import LogoutButton from "@/components/LogoutButton";

export const metadata: Metadata = {
  title: "Dummy Hotel Booking",
  description: "Sandbox hotel booking site for SDK tracking tests.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-4xl items-center justify-between p-4">
            <Link href="/" className="font-semibold">
              Dummy Hotel Booking
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              {session ? (
                <>
                  <Link href="/bookings">My Bookings</Link>
                  <span className="text-gray-500">{session.mobile}</span>
                  <LogoutButton />
                </>
              ) : (
                <Link href="/login">Login</Link>
              )}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-4xl p-4">{children}</main>
      </body>
    </html>
  );
}
