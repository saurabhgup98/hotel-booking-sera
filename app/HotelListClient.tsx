"use client";

import { useMemo, useState, type MouseEvent } from "react";
import Link from "next/link";

type RoomType = { pricePerNight: number };
type HotelPlain = {
  _id: string;
  name: string;
  city: string;
  description: string;
  roomTypes: RoomType[];
};

export default function HotelListClient({ hotels }: { hotels: HotelPlain[] }) {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("");
  const [location, setLocation] = useState("");
  const [filterError, setFilterError] = useState<string | null>(null);

  const cities = useMemo(
    () => Array.from(new Set(hotels.map((h) => h.city))).sort(),
    [hotels]
  );

  const visibleHotels = useMemo(
    () => (location === "" ? hotels : hotels.filter((h) => h.city === location)),
    [hotels, location]
  );

  const filtersFilled = checkIn !== "" && checkOut !== "" && guests !== "";

  function handleViewDetails(e: MouseEvent<HTMLAnchorElement>) {
    setFilterError(null);
    if (!filtersFilled) {
      e.preventDefault();
      setFilterError("Please fill in check-in, check-out and guests before viewing a hotel.");
      return;
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      e.preventDefault();
      setFilterError("Check-out must be after check-in.");
      return;
    }
  }

  function detailsHref(hotelId: string) {
    if (!filtersFilled) return `/hotels/${hotelId}`;
    const params = new URLSearchParams({ checkIn, checkOut, guests });
    return `/hotels/${hotelId}?${params.toString()}`;
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border bg-white p-4 shadow-md sm:p-5">
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Check-in</label>
            <input
              id="home-filter-checkin-input"
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full rounded-lg border p-2 focus:border-indigo-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Check-out</label>
            <input
              id="home-filter-checkout-input"
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full rounded-lg border p-2 focus:border-indigo-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Guests</label>
            <input
              id="home-filter-guests-input"
              type="number"
              min={1}
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="w-full rounded-lg border p-2 focus:border-indigo-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Location</label>
            <select
              id="home-filter-location-select"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-lg border p-2 focus:border-indigo-600 focus:outline-none"
            >
              <option value="">All Locations</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>
        {filterError && (
          <p id="home-filter-error" className="mt-3 text-sm text-red-600">
            {filterError}
          </p>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {visibleHotels.map((hotel) => {
          const fromPrice = Math.min(...hotel.roomTypes.map((rt) => rt.pricePerNight));
          return (
            <div
              key={hotel._id}
              id={`hotel-card-${hotel._id}`}
              className="overflow-hidden rounded-2xl border bg-white shadow-md transition hover:shadow-lg"
            >
              <div className="flex h-32 items-center justify-center bg-gradient-to-br from-indigo-500 to-indigo-700 text-4xl font-bold text-white">
                {hotel.name.charAt(0)}
              </div>
              <div className="space-y-2 p-5">
                <h2 className="text-lg font-semibold text-slate-900">{hotel.name}</h2>
                <p className="flex items-center gap-1 text-sm text-slate-500">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
                  </svg>
                  {hotel.city}
                </p>
                <p className="line-clamp-2 text-sm text-slate-600">{hotel.description}</p>
                <p className="pt-1 text-sm font-medium text-amber-600">From ₹{fromPrice} / night</p>
                <Link
                  id={`hotel-details-btn-${hotel._id}`}
                  href={detailsHref(hotel._id)}
                  onClick={handleViewDetails}
                  className="mt-2 inline-block w-full rounded-lg bg-indigo-600 px-4 py-2 text-center font-medium text-white hover:bg-indigo-700"
                >
                  View Details →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
