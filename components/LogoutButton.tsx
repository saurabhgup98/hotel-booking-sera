"use client";

import { useRouter } from "next/navigation";
import { HOME_FILTERS_STORAGE_KEY } from "@/lib/constants";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    try {
      localStorage.removeItem(HOME_FILTERS_STORAGE_KEY);
    } catch {}
    router.push("/");
    router.refresh();
  }

  return (
    <button
      id="logout-btn"
      onClick={handleLogout}
      className="rounded-xl border border-sera-line bg-white px-3 py-2 text-sm font-semibold text-sera-muted hover:border-sera-forest hover:text-sera-forest sm:px-4"
    >
      Log out
    </button>
  );
}
