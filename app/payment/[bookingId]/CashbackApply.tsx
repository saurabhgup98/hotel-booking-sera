"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatINR } from "@/lib/constants";

// Referral cashback on the payment page: the customer's balance (₹0 until
// someone they referred books) and Apply / Remove. Applying takes the whole
// available balance off what's left to pay; the server asks APTI for it.
export default function CashbackApply({
  bookingId,
  applied,
  available,
  pending,
}: {
  bookingId: string;
  applied: number;
  available: number;
  pending: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function change(method: "POST" | "DELETE") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cashback`, { method });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Couldn't update the cashback. Please try again.");
        return;
      }
      router.refresh(); // new payable amount
    } catch {
      setError("Couldn't update the cashback. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div id="cashback-panel" data-cashback-available={available} className="mt-4 rounded-2xl bg-white/10 p-4 text-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-white">Referral cashback</p>
          <p id="cashback-balance" className="text-white/75">
            {applied > 0 ? `${formatINR(applied)} applied` : `${formatINR(Math.floor(available))} available`}
          </p>
        </div>
        {applied > 0 ? (
          <button
            id="cashback-remove-btn"
            type="button"
            onClick={() => change("DELETE")}
            disabled={busy}
            className="rounded-lg border border-white/40 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-50"
          >
            {busy ? "…" : "Remove"}
          </button>
        ) : (
          <button
            id="cashback-apply-btn"
            type="button"
            onClick={() => change("POST")}
            disabled={busy || available < 1}
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-sera-forest-dark hover:bg-sera-mint disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Applying…" : "Apply"}
          </button>
        )}
      </div>
      {pending > 0 && (
        <p className="mt-2 text-xs text-white/60">{formatINR(Math.floor(pending))} more becomes available after your friends&apos; check-in dates.</p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-[#FFD2CC]">
          {error}
        </p>
      )}
    </div>
  );
}
