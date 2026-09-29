import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Fraunces, Manrope } from "next/font/google";
import { verifySession } from "@/lib/auth";
import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import Hotel from "@/models/Hotel";
import HeaderNav from "@/components/HeaderNav";
import SeraLogo from "@/components/SeraLogo";
import OfferFlow from "@/components/OfferFlow";

const display = Fraunces({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-display" });
const sans = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Sera Hotels and Resorts",
  description: "Handpicked hotels and resorts across India, with easy booking and instant confirmation.",
};

async function getCities(): Promise<string[]> {
  // The offer modal's Location dropdown. A DB hiccup here shouldn't take
  // down every page's layout — the modal just shows an empty list.
  try {
    await connectDB();
    const cities: string[] = await Hotel.distinct("city");
    return cities.sort();
  } catch {
    return [];
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  const cities = await getCities();

  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <head>
        <script
          async
          src="https://sdk.aptiinsights.com/sdk/v1/aptili.js?key=apk_KgEd9J7vrHSnbt3tbeDL5J3bxfg-qYhk&siteId=8e13eea4-1457-440a-a64a-07a9cf809d10"
        />
      </head>
      <body className="flex min-h-screen flex-col bg-sera-sand font-sans text-sera-ink antialiased">
        <header className="sticky top-0 z-30 border-b border-sera-line bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
            <Link href="/" aria-label="Sera Hotels and Resorts home">
              <SeraLogo />
            </Link>
            <HeaderNav session={session ? { mobile: session.mobile } : null} />
          </div>
        </header>
        <main className="w-full flex-1">{children}</main>
        <footer className="mt-16 bg-sera-forest-dark text-sera-sand">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <SeraLogo inverted />
            <div className="flex gap-6 text-sm text-sera-sand/80">
              <a href="#" className="hover:text-white">
                Privacy
              </a>
              <a href="#" className="hover:text-white">
                Terms
              </a>
              <a href="#" className="hover:text-white">
                Contact
              </a>
            </div>
            <span className="text-xs text-sera-sand/70">© 2026 Sera Hotels and Resorts. All rights reserved.</span>
          </div>
        </footer>
        <OfferFlow cities={cities} />
      </body>
    </html>
  );
}
