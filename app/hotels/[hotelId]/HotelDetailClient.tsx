"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type RoomType = {
  _id: string;
  name: string;
  pricePerNight: number;
  capacity: number;
  description: string;
};

type HotelPlain = {
  _id: string;
  name: string;
  roomTypes: RoomType[];
};

export default function HotelDetailClient({ hotel }: { hotel: HotelPlain }) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [loadingRoomId, setLoadingRoomId] = useState<string | null>(null);

  async function handleBook(roomTypeId: string) {
    setBookingError(null);
    setSearchError(null);

    if (!checkIn || !checkOut) {
      setSearchError("Please select check-in and check-out dates above.");
      return;
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      setSearchError("Check-out must be after check-in.");
      return;
    }

    setLoadingRoomId(roomTypeId);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotelId: hotel._id, roomTypeId, checkIn, checkOut, guests }),
      });
      if (res.status === 401) {
        router.push(`/login?next=/hotels/${hotel._id}`);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setBookingError(data.error || "Failed to create booking");
        return;
      }
      router.push(`/payment/${data.bookingId}`);
    } finally {
      setLoadingRoomId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-4 shadow-md sm:p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Check-in</label>
            <input
              id="search-checkin-input"
              type="date"
              required
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full rounded-lg border p-2 focus:border-indigo-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Check-out</label>
            <input
              id="search-checkout-input"
              type="date"
              required
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full rounded-lg border p-2 focus:border-indigo-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Guests</label>
            <input
              id="search-guests-input"
              type="number"
              min={1}
              required
              value={guests}
              onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
              className="w-full rounded-lg border p-2 focus:border-indigo-600 focus:outline-none"
            />
          </div>
        </div>
        {searchError && <p className="mt-3 text-sm text-red-600">{searchError}</p>}
      </div>

      <div className="space-y-4">
        {hotel.roomTypes.map((rt, idx) => (
          <div
            key={rt._id}
            id={`room-type-${rt._id}`}
            className="flex flex-col justify-between gap-4 rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-slate-900">{rt.name}</h2>
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                  Up to {rt.capacity} guests
                </span>
              </div>
              <p className="text-sm text-slate-600">{rt.description}</p>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <p className="text-2xl font-bold text-slate-900">
                ₹{rt.pricePerNight}
                <span className="text-sm font-normal text-slate-500"> /night</span>
              </p>
              <button
                // Only the first room type's button carries the literal
                // #book-now-btn id (a hotel page has 2 "Book" buttons, one
                // per room type, and DOM ids must be unique per page) —
                // every instance also carries the `book-now-btn` class, so
                // an SDK EventRule can target either the documented id
                // (first room type) or the shared class (all room types).
                id={idx === 0 ? "book-now-btn" : undefined}
                onClick={() => handleBook(rt._id)}
                disabled={loadingRoomId === rt._id}
                className="book-now-btn rounded-lg bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {loadingRoomId === rt._id ? "Booking…" : "Book"}
              </button>
            </div>
          </div>
        ))}
      </div>
      {bookingError && <p className="text-sm text-red-600">{bookingError}</p>}
    </div>
  );
}
