"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatINR } from "@/lib/constants";

export default function ReviewClient({
  hotelId,
  roomTypeId,
  roomTypeName,
  pricePerNight,
  nights,
  totalAmount,
  discountLabel,
  discountAmount,
  payable,
  checkIn,
  checkOut,
  guests,
}: {
  hotelId: string;
  roomTypeId: string;
  roomTypeName: string;
  pricePerNight: number;
  nights: number;
  totalAmount: number;
  // Today's checkout discount, already applied server-side (see
  // lib/todaysOffer.ts). 0 when there's no offer today.
  discountLabel: string | null;
  discountAmount: number;
  payable: number;
  checkIn: string;
  checkOut: string;
  guests: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const autoConfirmRan = useRef(false);

  const backParams = new URLSearchParams({ checkIn, checkOut, guests: String(guests) });
  const backHref = `/hotels/${hotelId}?${backParams.toString()}#rooms-section`;

  async function handleConfirm() {
    setError(null);
    setLoading(true);
    try {
      // No price is sent — the server recomputes it, discount included.
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotelId, roomTypeId, checkIn, checkOut, guests }),
      });
      if (res.status === 401) {
        // Send the visitor to log in, then straight back through this exact
        // URL (properly encoded — a raw, unencoded `next` value gets its own
        // `&checkIn=...` etc. parsed as top-level /login query params
        // instead of part of `next`, truncating the redirect target).
        // autoConfirm=1 tells the effect below to retry this POST
        // automatically once we're back.
        const reviewParams = new URLSearchParams({
          roomTypeId,
          checkIn,
          checkOut,
          guests: String(guests),
          autoConfirm: "1",
        });
        const next = `/hotels/${hotelId}/review?${reviewParams.toString()}`;
        router.push(`/login?next=${encodeURIComponent(next)}`);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create booking");
        return;
      }
      router.push(`/payment/${data.bookingId}`);
    } finally {
      setLoading(false);
    }
  }

  // If we just came back from a login triggered by this same Pay Now click,
  // finish the job automatically instead of waiting for a second click.
  useEffect(() => {
    if (autoConfirmRan.current) return;
    if (searchParams.get("autoConfirm") === "1") {
      autoConfirmRan.current = true;
      handleConfirm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="space-y-5 rounded-3xl border border-sera-line bg-white p-6 shadow-xl shadow-black/5">
        <h2 className="font-display text-xl text-sera-ink">Price details</h2>

        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-sera-muted">
              {roomTypeName} · {formatINR(pricePerNight)} × {nights} {nights === 1 ? "night" : "nights"}
            </dt>
            <dd className="font-semibold text-sera-ink">{formatINR(totalAmount)}</dd>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between gap-4 text-[#1F7A45]">
              <dt>Today&apos;s offer ({discountLabel})</dt>
              <dd id="review-discount-amount" className="font-semibold">
                −{formatINR(discountAmount)}
              </dd>
            </div>
          )}
        </dl>

        {discountAmount > 0 && (
          <p
            id="review-offer-applied"
            className="flex items-center gap-2 rounded-2xl bg-[#E3F5EA] px-4 py-3 text-sm font-semibold text-[#1F7A45]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 flex-none" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {discountLabel} applied — you save {formatINR(discountAmount)}
          </p>
        )}

        <div className="flex items-end justify-between gap-4 border-t border-sera-line pt-5">
          <span className="text-sm font-semibold text-sera-ink">Total payable</span>
          <span className="text-right">
            {discountAmount > 0 && <span className="block text-sm text-sera-muted line-through">{formatINR(totalAmount)}</span>}
            <span id="review-total-amount" className="text-3xl font-bold text-sera-ink">
              {formatINR(payable)}
            </span>
          </span>
        </div>

        {error && (
          <p role="alert" className="text-sm font-medium text-red-700">
            {error}
          </p>
        )}
        <button
          id="confirm-booking-btn"
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className="w-full rounded-xl bg-sera-forest py-3.5 text-base font-semibold text-white hover:bg-sera-forest-dark disabled:opacity-60"
        >
          {loading ? "Please wait…" : `Pay Now · ${formatINR(payable)}`}
        </button>
        <Link id="review-back-btn" href={backHref} className="block text-center text-sm font-medium text-sera-muted hover:text-sera-forest">
          ← Change room or dates
        </Link>
      </div>
    </aside>
  );
}
