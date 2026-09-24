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
      className="rounded-full bg-indigo-600 px-4 py-1.5 font-medium text-white hover:bg-indigo-700"
    >
      Logout
    </button>
  );
}
