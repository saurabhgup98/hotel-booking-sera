"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import Link from "next/link";
import {
  FALLBACK_HOTEL_IMAGE,
  FILTERS_UPDATED_EVENT,
  HOME_FILTERS_STORAGE_KEY,
  formatINR,
} from "@/lib/constants";
import { todayISO } from "@/lib/offerLead";

type RoomType = { pricePerNight: number };
type Review = { rating: number };
type HotelPlain = {
  _id: string;
  name: string;
  city: string;
  description: string;
  images?: string[];
  amenities?: string[];
  roomTypes: RoomType[];
  reviews?: Review[];
};

const inputClass =
  "h-12 w-full rounded-xl border border-[#D9D1C2] bg-white px-3.5 text-[15px] text-sera-ink focus:border-sera-forest focus:outline-none focus:ring-2 focus:ring-sera-forest/15";

export default function HotelListClient({ hotels }: { hotels: HotelPlain[] }) {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("");
  const [location, setLocation] = useState("");
  const [filterError, setFilterError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Restore filters from localStorage on mount — they should survive a
  // refresh or navigating to a hotel page and back, only reset by "Clear
  // filters" or logout (see LogoutButton.tsx). Also re-read whenever the
  // landing offer form (components/OfferFlow.tsx) fills them in while this
  // page is already open.
  useEffect(() => {
    function restore() {
      try {
        const saved = localStorage.getItem(HOME_FILTERS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setCheckIn(parsed.checkIn ?? "");
          setCheckOut(parsed.checkOut ?? "");
          setGuests(parsed.guests ?? "");
          setLocation(parsed.location ?? "");
        }
      } catch {}
    }
    restore();
    setHydrated(true);
    window.addEventListener(FILTERS_UPDATED_EVENT, restore);
    return () => window.removeEventListener(FILTERS_UPDATED_EVENT, restore);
  }, []);

  // Persist on every change, once the initial restore above has run (avoids
  // overwriting saved filters with the empty initial state before restore).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(HOME_FILTERS_STORAGE_KEY, JSON.stringify({ checkIn, checkOut, guests, location }));
    } catch {}
  }, [hydrated, checkIn, checkOut, guests, location]);

  function handleClearFilters() {
    setCheckIn("");
    setCheckOut("");
    setGuests("");
    setLocation("");
    setFilterError(null);
  }

  const cities = useMemo(() => Array.from(new Set(hotels.map((h) => h.city))).sort(), [hotels]);

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

  const today = todayISO();

  return (
    <div className="space-y-12">
      <div className="relative z-10 rounded-3xl border border-sera-line bg-white p-5 shadow-xl shadow-black/5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="home-filter-checkin-input" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-sera-muted">
              Check-in
            </label>
            <input
              id="home-filter-checkin-input"
              type="date"
              min={today}
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="home-filter-checkout-input" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-sera-muted">
              Check-out
            </label>
            <input
              id="home-filter-checkout-input"
              type="date"
              min={checkIn || today}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="home-filter-guests-input" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-sera-muted">
              Guests
            </label>
            <input
              id="home-filter-guests-input"
              type="number"
              min={1}
              placeholder="2"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="home-filter-location-select" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-sera-muted">
              Location
            </label>
            <select
              id="home-filter-location-select"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={inputClass}
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
        <div className="mt-4 flex items-center justify-between gap-4">
          {filterError ? (
            <p id="home-filter-error" role="alert" className="text-sm font-medium text-red-700">
              {filterError}
            </p>
          ) : (
            <span />
          )}
          <button
            id="home-filter-clear-btn"
            type="button"
            onClick={handleClearFilters}
            className="flex-none text-sm font-semibold text-sera-muted hover:text-sera-forest"
          >
            Clear filters
          </button>
        </div>
      </div>

      <section id="hotels-section" className="scroll-mt-24 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-3xl text-sera-ink">{location ? `Our stays in ${location}` : "Our stays"}</h2>
            <p className="mt-1 text-sm text-sera-muted">
              {visibleHotels.length} {visibleHotels.length === 1 ? "property" : "properties"} · Best rates, booked direct
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {visibleHotels.map((hotel) => {
            const fromPrice = Math.min(...hotel.roomTypes.map((rt) => rt.pricePerNight));
            const reviews = hotel.reviews ?? [];
            const rating = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;
            return (
              <article
                key={hotel._id}
                id={`hotel-card-${hotel._id}`}
                className="group overflow-hidden rounded-3xl border border-sera-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/5"
              >
                <div className="relative h-60 overflow-hidden">
                  <img
                    src={hotel.images?.[0] || FALLBACK_HOTEL_IMAGE}
                    alt={hotel.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-sera-ink">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 text-sera-forest" aria-hidden="true">
                      <path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12Z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                    {hotel.city}
                  </span>
                  {rating !== null && (
                    <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-sera-forest px-2.5 py-1 text-xs font-bold text-white">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                        <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2Z" />
                      </svg>
                      {rating.toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="space-y-3 p-6">
                  <h3 className="font-display text-2xl text-sera-ink">{hotel.name}</h3>
                  <p className="line-clamp-2 text-sm leading-relaxed text-sera-muted">{hotel.description}</p>
                  {hotel.amenities && hotel.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {hotel.amenities.slice(0, 3).map((a) => (
                        <span key={a} className="rounded-full bg-sera-cream px-2.5 py-1 text-xs font-medium text-sera-muted ring-1 ring-sera-line">
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-end justify-between gap-4 pt-2">
                    <p className="text-sm text-sera-muted">
                      From <span className="text-xl font-bold text-sera-ink">{formatINR(fromPrice)}</span> / night
                    </p>
                    <Link
                      id={`hotel-details-btn-${hotel._id}`}
                      href={detailsHref(hotel._id)}
                      onClick={handleViewDetails}
                      className="flex-none rounded-xl bg-sera-forest px-5 py-3 text-sm font-semibold text-white hover:bg-sera-forest-dark"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
