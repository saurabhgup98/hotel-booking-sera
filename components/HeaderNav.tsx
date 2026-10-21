"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";
import { formatMobile } from "@/lib/constants";

type Session = { mobile: string } | null;

function NavItem({ href, label, id, hideOnMobile = false }: { href: string; label: string; id: string; hideOnMobile?: boolean }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  const base = `border-b-2 py-6 text-sm font-semibold ${hideOnMobile ? "hidden sm:inline-block" : "inline-block"}`;

  if (isActive) {
    return (
      <span id={id} aria-current="page" className={`${base} border-sera-forest text-sera-forest`}>
        {label}
      </span>
    );
  }

  return (
    <Link id={id} href={href} className={`${base} border-transparent text-sera-muted hover:text-sera-forest`}>
      {label}
    </Link>
  );
}

export default function HeaderNav({ session }: { session: Session }) {
  return (
    <nav className="flex items-center gap-3 sm:gap-7">
      <NavItem href="/" label="Home" id="nav-home-link" hideOnMobile />
      {session ? (
        <>
          <NavItem href="/bookings" label="My Bookings" id="nav-bookings-link" />
          <NavItem href="/calculator" label="Calculator" id="nav-calculator-link" />
          {/* Hidden on phones so the links fit; still in the page for the SDK. */}
          <div className="hidden items-center gap-2 rounded-full border border-sera-line bg-sera-cream py-1 pl-1 pr-3 sm:flex sm:pr-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sera-mint text-sera-forest">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <rect x="6" y="2" width="12" height="20" rx="2.5" />
                <path d="M11 18h2" />
              </svg>
            </span>
            <span className="flex flex-col leading-tight">
              <span className="hidden text-[10px] font-bold tracking-[0.1em] text-[#2E6B55] sm:block">SIGNED IN</span>
              <span id="nav-mobile-number" className="text-xs font-semibold tabular-nums tracking-wide sm:text-sm">
                {formatMobile(session.mobile)}
              </span>
            </span>
          </div>
          <LogoutButton />
        </>
      ) : (
        <>
          <NavItem href="/calculator" label="Calculator" id="nav-calculator-link" />
          <Link
          href="/login"
          className="rounded-xl bg-sera-forest px-5 py-2.5 text-sm font-semibold text-white hover:bg-sera-forest-dark"
        >
            Login
          </Link>
        </>
      )}
    </nav>
  );
}
