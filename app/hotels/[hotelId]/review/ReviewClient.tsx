"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function ReviewClient({
  hotelId,
  roomTypeId,
  checkIn,
  checkOut,
  guests,
}: {
  hotelId: string;
  roomTypeId: string;
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
  const backHref = `/hotels/${hotelId}?${backParams.toString()}`;

  async function handleConfirm() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotelId, roomTypeId, checkIn, checkOut, guests }),
      });
      if (res.status === 401) {
        // Send the visitor to log in, then straight back through this exact
        // URL (properly encoded this time — a raw, unencoded `next` value
        // gets its own `&checkIn=...` etc. parsed as top-level /login query
        // params instead of part of `next`, truncating the redirect target).
        // autoConfirm=1 tells the effect below to retry this POST
        // automatically once we're back, instead of requiring a second
        // manual click after login.
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

  // If we just came back from a login triggered by this same confirm click,
  // finish the job automatically instead of dropping the user back on this
  // page waiting for a second click.
  useEffect(() => {
    if (autoConfirmRan.current) return;
    if (searchParams.get("autoConfirm") === "1") {
      autoConfirmRan.current = true;
      handleConfirm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        id="confirm-booking-btn"
        onClick={handleConfirm}
        disabled={loading}
        className="w-full rounded-lg bg-indigo-600 p-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? "Confirming…" : "Confirm & Pay"}
      </button>
      <Link
        id="review-back-btn"
        href={backHref}
        className="block text-center text-sm text-slate-500 hover:text-indigo-600"
      >
        ← Change room or dates
      </Link>
    </div>
  );
}
