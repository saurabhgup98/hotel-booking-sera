"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function BookForm({
  hotelId,
  roomTypeId,
  isFirst,
}: {
  hotelId: string;
  roomTypeId: string;
  isFirst?: boolean;
}) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleBook(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotelId, roomTypeId, checkIn, checkOut }),
      });
      if (res.status === 401) {
        router.push(`/login?next=/hotels/${hotelId}`);
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
    <form onSubmit={handleBook} className="mt-3 flex flex-wrap items-end gap-2">
      <div>
        <label className="block text-xs text-gray-500">Check-in</label>
        <input
          id={`checkin-${roomTypeId}`}
          type="date"
          required
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          className="rounded border p-1"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500">Check-out</label>
        <input
          id={`checkout-${roomTypeId}`}
          type="date"
          required
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          className="rounded border p-1"
        />
      </div>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
      <button
        // NOTE: only the first room type's button carries the literal
        // #book-now-btn id (a hotel page has 2 "Book Now" buttons, one per
        // room type, and DOM ids must be unique per page) — every instance
        // also carries the `book-now-btn` class, so an SDK EventRule can
        // target either the documented id (first room type) or the shared
        // class (all room types). See README's "Stable DOM ids" section.
        id={isFirst ? "book-now-btn" : undefined}
        type="submit"
        disabled={loading}
        className="book-now-btn rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-50"
      >
        Book Now
      </button>
    </form>
  );
}
