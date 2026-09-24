"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";

type Session = { mobile: string } | null;

function NavItem({ href, label, id }: { href: string; label: string; id: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  if (isActive) {
    return (
      <span id={id} aria-current="page" className="font-semibold text-indigo-600">
        {label}
      </span>
    );
  }

  return (
    <Link id={id} href={href} className="text-slate-600 hover:text-indigo-600">
      {label}
    </Link>
  );
}

export default function HeaderNav({ session }: { session: Session }) {
  return (
    <nav className="flex items-center gap-5 text-sm">
      <NavItem href="/" label="Home" id="nav-home-link" />
      {session ? (
        <>
          <NavItem href="/bookings" label="My Bookings" id="nav-bookings-link" />
          <span id="nav-mobile-number" className="text-xs text-slate-400 sm:text-sm">
            {session.mobile}
          </span>
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
  );
}
