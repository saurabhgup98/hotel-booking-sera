"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        router.push(`/login?next=/hotels/${hotelId}/review?roomTypeId=${roomTypeId}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
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
