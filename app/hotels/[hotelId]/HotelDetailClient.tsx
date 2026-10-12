"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FALLBACK_HOTEL_IMAGE,
  FILTERS_UPDATED_EVENT,
  HOME_FILTERS_STORAGE_KEY,
  OFFER_WHATSAPP_ENABLED,
  ROOM_TYPE_IMAGES,
  announceStayDates,
  formatINR,
  formatMobile,
} from "@/lib/constants";
import { couponSentToday, readOfferLead, todayISO, updateOfferLead, type OfferLead } from "@/lib/offerLead";
import { WhatsAppGlyph } from "@/components/OfferFlow";

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
  city: string;
  description: string;
  amenities?: string[];
  roomTypes: RoomType[];
};

const inputClass =
  "h-12 w-full rounded-xl border border-[#D9D1C2] bg-white px-3.5 text-[15px] text-sera-ink focus:border-sera-forest focus:outline-none focus:ring-2 focus:ring-sera-forest/15";

function nightsBetween(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 0;
  const n = Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000);
  return n > 0 ? n : 0;
}

export default function HotelDetailClient({ hotel, children }: { hotel: HotelPlain; children?: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") ?? "");
  const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") ?? "");
  const [guests, setGuests] = useState(Number(searchParams.get("guests")) || 2);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [lead, setLead] = useState<OfferLead | null>(null);
  // Set while the one-time "check your WhatsApp" popup is open — the review
  // URL to continue to once the visitor clicks OK.
  const [pendingReviewHref, setPendingReviewHref] = useState<string | null>(null);

  // No dates in the URL (e.g. the visitor landed here directly) → fall back
  // to the home-page filters, which the landing offer form also fills. Also
  // re-applied if that form is submitted while this page is open.
  useEffect(() => {
    function fillFromSavedFilters() {
      setLead(readOfferLead());
      if (searchParams.get("checkIn")) return;
      try {
        const saved = JSON.parse(localStorage.getItem(HOME_FILTERS_STORAGE_KEY) || "null");
        if (saved?.checkIn) setCheckIn(saved.checkIn);
        if (saved?.checkOut) setCheckOut(saved.checkOut);
        if (Number(saved?.guests)) setGuests(Number(saved.guests));
      } catch {}
    }
    fillFromSavedFilters();
    window.addEventListener(FILTERS_UPDATED_EVENT, fillFromSavedFilters);
    return () => window.removeEventListener(FILTERS_UPDATED_EVENT, fillFromSavedFilters);
  }, [searchParams]);

  // Tell the offer flow about the stay being looked at (dates, guests, city).
  useEffect(() => {
    announceStayDates({ checkIn, checkOut, guests: String(guests), location: hotel.city });
  }, [checkIn, checkOut, guests, hotel.city]);

  const nights = nightsBetween(checkIn, checkOut);

  function handleBook(roomTypeId: string) {
    setSearchError(null);

    if (!checkIn || !checkOut) {
      setSearchError("Please select check-in and check-out dates.");
      document.getElementById("stay-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      setSearchError("Check-out must be after check-in.");
      return;
    }

    const params = new URLSearchParams({ roomTypeId, checkIn, checkOut, guests: String(guests) });
    const href = `/hotels/${hotel._id}/review?${params.toString()}`;

    // The visitor's first room "Book Now" of the day shows this popup and
    // asks APTI (through our server) to send today's offer on WhatsApp.
    // Later clicks that day go straight to review, so no second message.
    // With OFFER_WHATSAPP_ENABLED off, every click goes straight to review.
    const currentLead = OFFER_WHATSAPP_ENABLED ? readOfferLead() : null;
    if (currentLead && !couponSentToday(currentLead)) {
      updateOfferLead({ couponSentOn: todayISO() });
      sendOfferWhatsapp(currentLead.name);
      setLead(currentLead);
      setPendingReviewHref(href);
      return;
    }
    router.push(href);
  }

  function handleWhatsAppOk() {
    const href = pendingReviewHref;
    setPendingReviewHref(null);
    if (href) router.push(href);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-10">
        <section className="space-y-3">
          <h2 className="font-display text-2xl text-sera-ink">About this stay</h2>
          <p className="leading-relaxed text-sera-muted">{hotel.description}</p>
        </section>

        {hotel.amenities && hotel.amenities.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-display text-2xl text-sera-ink">Amenities</h2>
            <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {hotel.amenities.map((a) => (
                <li key={a} className="flex items-center gap-3 rounded-2xl border border-sera-line bg-white px-4 py-3 text-sm font-medium text-sera-ink">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-sera-mint text-sera-forest">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  {a}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section id="rooms-section" className="scroll-mt-24 space-y-4">
          <h2 className="font-display text-2xl text-sera-ink">Choose your room</h2>
          {hotel.roomTypes.map((rt, idx) => (
            <div
              key={rt._id}
              id={`room-type-${rt._id}`}
              className="flex flex-col overflow-hidden rounded-3xl border border-sera-line bg-white transition hover:shadow-lg hover:shadow-black/5 sm:flex-row"
            >
              <img
                src={ROOM_TYPE_IMAGES[rt.name] || FALLBACK_HOTEL_IMAGE}
                alt={rt.name}
                className="h-48 w-full object-cover sm:h-auto sm:w-60"
              />
              <div className="flex flex-1 flex-col justify-between gap-4 p-5 sm:flex-row sm:items-end">
                <div className="space-y-2">
                  <h3 className="font-display text-xl text-sera-ink">{rt.name}</h3>
                  <p className="text-sm text-sera-muted">{rt.description}</p>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-sera-cream px-3 py-1 text-xs font-semibold text-sera-muted ring-1 ring-sera-line">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    Up to {rt.capacity} guests
                  </span>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <p className="text-2xl font-bold text-sera-ink">
                    {formatINR(rt.pricePerNight)}
                    <span className="text-sm font-normal text-sera-muted"> / night</span>
                  </p>
                  {nights > 0 && (
                    <p className="text-xs text-sera-muted">
                      {formatINR(rt.pricePerNight * nights)} for {nights} {nights === 1 ? "night" : "nights"}
                    </p>
                  )}
                  <button
                    // Only the first room type's button carries the literal
                    // #book-now-btn id (a hotel page has 2 "Book" buttons, one
                    // per room type, and DOM ids must be unique per page) —
                    // every instance also carries the `book-now-btn` class, so
                    // an SDK EventRule can target either the documented id
                    // (first room type) or the shared class (all room types).
                    id={idx === 0 ? "book-now-btn" : undefined}
                    type="button"
                    onClick={() => handleBook(rt._id)}
                    className="book-now-btn mt-1 rounded-xl bg-sera-forest px-6 py-3 text-sm font-semibold text-white hover:bg-sera-forest-dark"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>

        {children}
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div id="stay-card" className="space-y-4 rounded-3xl border border-sera-line bg-white p-6 shadow-xl shadow-black/5">
          <h2 className="font-display text-xl text-sera-ink">Your stay</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="search-checkin-input" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-sera-muted">
                Check-in
              </label>
              <input
                id="search-checkin-input"
                type="date"
                required
                min={todayISO()}
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="search-checkout-input" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-sera-muted">
                Check-out
              </label>
              <input
                id="search-checkout-input"
                type="date"
                required
                min={checkIn || todayISO()}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label htmlFor="search-guests-input" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-sera-muted">
              Guests
            </label>
            <input
              id="search-guests-input"
              type="number"
              min={1}
              required
              value={guests}
              onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
              className={inputClass}
            />
          </div>
          {searchError && (
            <p role="alert" className="text-sm font-medium text-red-700">
              {searchError}
            </p>
          )}
          {nights > 0 && (
            <p className="text-sm text-sera-muted">
              {nights} {nights === 1 ? "night" : "nights"} · {guests} {guests === 1 ? "guest" : "guests"}
            </p>
          )}
          {lead && (
            <div className="flex gap-3 rounded-2xl bg-sera-brass-soft p-4 text-sm text-[#6E4C18]">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-white font-display text-sm font-semibold text-sera-brass">
                %
              </span>
              <p>
                Pick a room — today&apos;s discount is applied automatically at checkout.
              </p>
            </div>
          )}
          <a
            href="#rooms-section"
            className="block rounded-xl border border-sera-forest py-3 text-center text-sm font-semibold text-sera-forest hover:bg-sera-mint"
          >
            See rooms
          </a>
        </div>
      </aside>

      {pendingReviewHref && lead && <WhatsAppCouponPopup lead={lead} onOk={handleWhatsAppOk} />}
    </div>
  );
}

// Fire-and-forget: the visitor continues to review whatever happens. The
// server picks the number from the login session and the discount from the
// database; only the greeting name comes from here.
function sendOfferWhatsapp(name: string) {
  fetch("/api/whatsapp/offer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (!data?.sent) console.info("[offer WhatsApp] not sent:", data?.reason);
    })
    .catch(() => {});
}

function WhatsAppCouponPopup({ lead, onOk }: { lead: OfferLead; onOk: () => void }) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sera-ink/60 p-4 backdrop-blur-sm animate-fade-in">
      <div
        id="whatsapp-coupon-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="whatsapp-popup-title"
        // Exposed for SDK extractors (APTI sends the coupon message off this
        // popup appearing): who to message and on which number.
        data-guest-name={lead.name}
        data-whatsapp-number={lead.whatsapp}
        className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl animate-pop-in"
      >
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E3F5EA] text-[#1F8F4E]">
          <WhatsAppGlyph className="h-8 w-8" />
        </span>
        <h2 id="whatsapp-popup-title" className="mt-5 font-display text-2xl text-sera-ink">
          Check your WhatsApp
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-sera-muted">
          We&apos;ve sent your offer details to{" "}
          <span id="whatsapp-popup-number" className="whitespace-nowrap font-semibold text-sera-ink">
            {formatMobile(lead.whatsapp)}
          </span>
          . Your discount is applied automatically on the next step.
        </p>
        <button
          id="whatsapp-popup-ok-btn"
          type="button"
          onClick={onOk}
          className="mt-6 h-12 w-full rounded-xl bg-sera-forest text-[15px] font-semibold text-white hover:bg-sera-forest-dark"
        >
          OK
        </button>
      </div>
    </div>
  );
}
