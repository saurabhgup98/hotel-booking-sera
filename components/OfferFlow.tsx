"use client";

import { useEffect, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  FILTERS_UPDATED_EVENT,
  HERO_IMAGE,
  HOME_FILTERS_STORAGE_KEY,
  OFFER_DISCOUNT_PERCENT,
  formatStayDate,
} from "@/lib/constants";
import { readOfferLead, todayISO, updateOfferLead, writeOfferLead, type OfferLead } from "@/lib/offerLead";

type Stage = "form" | "creating" | "offer" | null;

// Pages where interrupting the visitor with the offer makes no sense (mid
// login/payment, or looking at a booking they already made).
const EXCLUDED_PREFIXES = ["/login", "/payment", "/booking", "/bookings"];

const CREATING_STEPS = ["Checking availability for your dates", "Comparing rates across our hotels", "Curating your offer"];
const CREATING_DURATION_MS = 2800;
// The offer form doesn't interrupt the visitor the moment they land — it
// opens after they've had this long to look around.
const FORM_DELAY_MS = 10_000;

/**
 * The landing-page offer flow, shown once per visitor:
 *   1. "form"     — non-dismissable modal (opens FORM_DELAY_MS after landing)
 *                   collecting name, OTP-verified WhatsApp number and stay
 *                   details. Verifying the OTP also logs the visitor in (same
 *                   /api/auth/verify-otp as the login page). On submit the
 *                   stay details are also written into the home-page filters.
 *   2. "creating" — short "creating your offer" loader.
 *   3. "offer"    — "Today's Offer" popup; its Book Now closes the flow and
 *                   takes the visitor to the hotel list / rooms.
 * The site itself never sends WhatsApp messages — APTI does, off the SDK
 * events these screens (and their stable ids) produce.
 */
export default function OfferFlow({ cities }: { cities: string[] }) {
  const pathname = usePathname();
  const [stage, setStage] = useState<Stage>(null);
  const [lead, setLead] = useState<OfferLead | null>(null);
  // The 10s delay counts from the first page of the visit, not per page —
  // this component lives in the root layout, so it survives client-side
  // navigation. Once elapsed, the form opens on the next eligible page.
  const [formDelayElapsed, setFormDelayElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFormDelayElapsed(true), FORM_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (EXCLUDED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      setStage(null);
      return;
    }
    // Don't yank an in-progress step (e.g. the loader) back to the form.
    if (stage === "creating" || stage === "offer") return;
    const saved = readOfferLead();
    setLead(saved);
    if (!saved) setStage(formDelayElapsed ? "form" : null);
    else if (!saved.offerSeen) setStage("offer");
    else setStage(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, formDelayElapsed]);

  // Lock page scroll behind any open step.
  useEffect(() => {
    if (!stage) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [stage]);

  useEffect(() => {
    if (stage !== "creating") return;
    const timer = setTimeout(() => setStage("offer"), CREATING_DURATION_MS);
    return () => clearTimeout(timer);
  }, [stage]);

  function handleLeadSubmitted(newLead: OfferLead) {
    writeOfferLead(newLead);
    try {
      localStorage.setItem(
        HOME_FILTERS_STORAGE_KEY,
        JSON.stringify({
          checkIn: newLead.checkIn,
          checkOut: newLead.checkOut,
          guests: newLead.guests,
          location: newLead.location,
        })
      );
    } catch {}
    window.dispatchEvent(new Event(FILTERS_UPDATED_EVENT));
    setLead(newLead);
    setStage("creating");
  }

  function handleBookNow() {
    updateOfferLead({ offerSeen: true });
    setStage(null);
    // Deferred until the popup has unmounted and released the body scroll
    // lock — scrolling while overflow is still hidden is a no-op.
    setTimeout(() => {
      const target = document.getElementById(pathname === "/" ? "hotels-section" : "rooms-section");
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  }

  if (!stage) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sera-ink/60 p-3 backdrop-blur-sm animate-fade-in sm:p-6">
      {stage === "form" && <LeadForm cities={cities} onSubmitted={handleLeadSubmitted} />}
      {stage === "creating" && <CreatingOffer />}
      {stage === "offer" && lead && <OfferPopup lead={lead} onBookNow={handleBookNow} />}
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-sera-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "h-12 w-full rounded-xl border border-[#D9D1C2] bg-white px-3.5 text-[15px] text-sera-ink placeholder:text-[#9A9385] focus:border-sera-forest focus:outline-none focus:ring-2 focus:ring-sera-forest/15";

function LeadForm({ cities, onSubmitted }: { cities: string[]; onSubmitted: (lead: OfferLead) => void }) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [otpStep, setOtpStep] = useState<"idle" | "sent" | "verified">("idle");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpBusy, setOtpBusy] = useState(false);
  const router = useRouter();
  const today = todayISO();

  const mobileDigits = whatsapp.replace(/\D/g, "");

  async function handleSendOtp() {
    setOtpError(null);
    if (mobileDigits.length < 6) {
      setOtpError("Please enter your WhatsApp number.");
      return;
    }
    setOtpBusy(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: mobileDigits }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || "Couldn't send the OTP. Please check the number.");
        return;
      }
      setOtp("");
      setOtpStep("sent");
    } catch {
      setOtpError("Couldn't send the OTP. Please try again.");
    } finally {
      setOtpBusy(false);
    }
  }

  // Same endpoint as the login page: a correct OTP (FIXED_OTP) also logs the
  // visitor in, so Pay Now later doesn't ask them to verify again.
  async function handleVerifyOtp() {
    setOtpError(null);
    if (!otp.trim()) {
      setOtpError("Please enter the OTP.");
      return;
    }
    setOtpBusy(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: mobileDigits, otp: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || "Incorrect OTP");
        return;
      }
      setOtpStep("verified");
      router.refresh(); // header switches to the signed-in state
    } catch {
      setOtpError("Couldn't verify the OTP. Please try again.");
    } finally {
      setOtpBusy(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !whatsapp.trim() || !checkIn || !checkOut || !guests || !location) {
      setError("Please fill in all the details so we can curate your offer.");
      return;
    }
    if (otpStep !== "verified") {
      setError("Please verify your WhatsApp number with the OTP.");
      return;
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      setError("Check-out must be after check-in.");
      return;
    }
    onSubmitted({
      name: name.trim(),
      whatsapp: whatsapp.trim(),
      whatsappVerified: true,
      checkIn,
      checkOut,
      guests,
      location,
      createdAt: new Date().toISOString(),
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="offer-form-title"
      className="grid max-h-[94vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-pop-in md:grid-cols-[280px_1fr]"
    >
      <div className="relative hidden md:block">
        <img src={HERO_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-sera-forest-dark/90 via-sera-forest-dark/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 text-white">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-white/80">SERA HOTELS AND RESORTS</p>
          <p className="mt-2 font-display text-2xl leading-tight">An offer made just for your stay</p>
        </div>
      </div>

      <form id="offer-lead-form" onSubmit={handleSubmit} noValidate className="overflow-y-auto p-6 sm:p-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sera-brass-soft px-3 py-1 text-xs font-semibold text-sera-brass">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
            <path d="M20 12v10H4V12" />
            <path d="M2 7h20v5H2z" />
            <path d="M12 22V7" />
            <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7Z" />
            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7Z" />
          </svg>
          Exclusive offer
        </span>
        <h2 id="offer-form-title" className="mt-3 font-display text-[28px] leading-tight text-sera-ink">
          We will curate the best offer for you
        </h2>
        <p className="mt-1.5 text-sm text-sera-muted">Please fill in the details below.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Full name" htmlFor="offer-name-input">
              <input
                id="offer-name-input"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="WhatsApp number" htmlFor="offer-whatsapp-input">
              <div className="flex h-12 overflow-hidden rounded-xl border border-[#D9D1C2] bg-white focus-within:border-sera-forest focus-within:ring-2 focus-within:ring-sera-forest/15">
                <span className="flex items-center gap-1.5 border-r border-sera-line bg-sera-cream px-3 text-sm font-semibold text-sera-muted">
                  <WhatsAppGlyph className="h-4 w-4 text-[#1F8F4E]" />
                  +91
                </span>
                <input
                  id="offer-whatsapp-input"
                  name="whatsapp"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="98765 43210"
                  value={whatsapp}
                  disabled={otpStep === "verified"}
                  onChange={(e) => {
                    setWhatsapp(e.target.value);
                    // A changed number needs a fresh OTP.
                    if (otpStep === "sent") setOtpStep("idle");
                  }}
                  className="min-w-0 flex-1 bg-transparent px-3.5 text-[15px] tracking-wide text-sera-ink placeholder:text-[#9A9385] focus:outline-none disabled:text-sera-muted"
                />
                {otpStep === "verified" ? (
                  <span id="offer-otp-verified" className="flex items-center gap-1 pr-3 text-sm font-semibold text-[#1F7A45]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    Verified
                  </span>
                ) : (
                  <button
                    id="offer-send-otp-btn"
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpBusy}
                    className="flex-none px-4 text-sm font-semibold text-sera-forest hover:text-sera-forest-dark disabled:opacity-50"
                  >
                    {otpStep === "sent" ? "Resend OTP" : "Send OTP"}
                  </button>
                )}
              </div>
            </Field>
          </div>
          {otpStep === "sent" && (
            <div className="sm:col-span-2">
              <Field label="Enter OTP" htmlFor="offer-otp-input">
                <div className="flex gap-2">
                  <input
                    id="offer-otp-input"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className={`${inputClass} tracking-[0.3em]`}
                  />
                  <button
                    id="offer-verify-otp-btn"
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={otpBusy}
                    className="h-12 flex-none rounded-xl bg-sera-ink px-5 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
                  >
                    {otpBusy ? "Verifying…" : "Verify"}
                  </button>
                </div>
              </Field>
              <p className="mt-1.5 text-xs text-sera-muted">We&apos;ve sent a one-time code to {whatsapp.trim()}.</p>
            </div>
          )}
          {otpError && (
            <p id="offer-otp-error" role="alert" className="-mt-2 text-sm font-medium text-red-700 sm:col-span-2">
              {otpError}
            </p>
          )}
          <Field label="Check-in" htmlFor="offer-checkin-input">
            <input
              id="offer-checkin-input"
              name="checkIn"
              type="date"
              min={today}
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Check-out" htmlFor="offer-checkout-input">
            <input
              id="offer-checkout-input"
              name="checkOut"
              type="date"
              min={checkIn || today}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Guests" htmlFor="offer-guests-input">
            <select
              id="offer-guests-input"
              name="guests"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className={inputClass}
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={String(n)}>
                  {n} {n === 1 ? "Guest" : "Guests"}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Location" htmlFor="offer-location-select">
            <select
              id="offer-location-select"
              name="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={inputClass}
            >
              <option value="">Select location</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {error && (
          <p id="offer-form-error" role="alert" className="mt-4 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <button
          id="offer-submit-btn"
          type="submit"
          className="mt-6 h-12 w-full rounded-xl bg-sera-forest text-[15px] font-semibold text-white hover:bg-sera-forest-dark"
        >
          Curate my offer
        </button>
        <p className="mt-3 text-center text-xs text-sera-muted">We&apos;ll share your offer on WhatsApp. No spam.</p>
      </form>
    </div>
  );
}

function CreatingOffer() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(
      () => setStep((s) => Math.min(s + 1, CREATING_STEPS.length - 1)),
      CREATING_DURATION_MS / CREATING_STEPS.length
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      id="offer-creating-loader"
      role="status"
      aria-live="polite"
      className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl animate-pop-in"
    >
      <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-sera-mint border-t-sera-forest" />
      <h2 className="mt-5 font-display text-2xl text-sera-ink">Creating your offer…</h2>
      <ul className="mt-5 space-y-3 text-left text-sm">
        {CREATING_STEPS.map((label, i) => (
          <li key={label} className={`flex items-center gap-3 ${i <= step ? "text-sera-ink" : "text-[#A8A194]"}`}>
            <span
              className={`flex h-5 w-5 flex-none items-center justify-center rounded-full ${
                i < step ? "bg-sera-forest text-white" : i === step ? "border-2 border-sera-forest" : "border-2 border-sera-line"
              }`}
            >
              {i < step && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OfferPopup({ lead, onBookNow }: { lead: OfferLead; onBookNow: () => void }) {
  const firstName = lead.name.split(" ")[0];
  return (
    <div
      id="offer-popup"
      role="dialog"
      aria-modal="true"
      aria-labelledby="offer-popup-title"
      className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-pop-in"
    >
      <div className="relative bg-sera-forest px-7 pb-7 pt-8 text-center text-white">
        <p className="text-xs font-semibold tracking-[0.22em] text-white/75">TODAY&apos;S OFFER</p>
        <p id="offer-popup-title" className="mt-2 font-display leading-none">
          <span className="text-7xl font-semibold">{OFFER_DISCOUNT_PERCENT}%</span>
          <span className="ml-2 text-3xl">off</span>
        </p>
        <p className="mt-3 text-sm text-white/85">
          Curated for {firstName} · {lead.location}
        </p>
        <p className="mt-1 text-xs text-white/70">
          {formatStayDate(lead.checkIn, false)} – {formatStayDate(lead.checkOut, false)} · {lead.guests}{" "}
          {lead.guests === "1" ? "guest" : "guests"}
        </p>
      </div>
      <div className="p-7">
        <p className="text-center text-base font-semibold text-sera-ink">Book now to avail the offer.</p>
        <div className="mt-4 flex gap-3 rounded-2xl bg-sera-brass-soft p-4 text-sm text-[#6E4C18]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <p>
            <span className="font-semibold">Note:</span> your final discount is applied when you select a room and
            continue.
          </p>
        </div>
        <button
          id="offer-book-now-btn"
          type="button"
          onClick={onBookNow}
          className="mt-5 h-12 w-full rounded-xl bg-sera-forest text-[15px] font-semibold text-white hover:bg-sera-forest-dark"
        >
          Book Now
        </button>
      </div>
    </div>
  );
}

export function WhatsAppGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 21l1.65-4.95A8.5 8.5 0 1 1 7.95 19.35L3 21Z" />
      <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.2-1.8-1-1 .7c-1-.4-2-1.4-2.4-2.4l.7-1-1-1.8L9 9.5Z" />
    </svg>
  );
}
