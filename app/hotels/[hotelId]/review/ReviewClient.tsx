"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatINR } from "@/lib/constants";

type AppliedCoupon = { code: string; discountPercent: number; discountAmount: number };

export default function ReviewClient({
  hotelId,
  roomTypeId,
  roomTypeName,
  pricePerNight,
  nights,
  totalAmount,
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
  checkIn: string;
  checkOut: string;
  guests: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const autoConfirmRan = useRef(false);

  const payable = totalAmount - (coupon?.discountAmount ?? 0);

  const backParams = new URLSearchParams({ checkIn, checkOut, guests: String(guests) });
  const backHref = `/hotels/${hotelId}?${backParams.toString()}#rooms-section`;

  async function validateCoupon(code: string): Promise<AppliedCoupon | null> {
    setCouponError(null);
    setApplying(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, amount: totalAmount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error || "This coupon code is invalid");
        return null;
      }
      setCoupon(data);
      setCouponInput(data.code);
      return data;
    } catch {
      setCouponError("Couldn't check this code. Please try again.");
      return null;
    } finally {
      setApplying(false);
    }
  }

  function handleApply(e: FormEvent) {
    e.preventDefault();
    if (!couponInput.trim()) {
      setCouponError("Please enter the coupon code from your WhatsApp.");
      return;
    }
    validateCoupon(couponInput);
  }

  function handleRemoveCoupon() {
    setCoupon(null);
    setCouponInput("");
    setCouponError(null);
  }

  async function handleConfirm(couponCode = coupon?.code) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotelId, roomTypeId, checkIn, checkOut, guests, couponCode }),
      });
      if (res.status === 401) {
        // Send the visitor to log in, then straight back through this exact
        // URL (properly encoded — a raw, unencoded `next` value gets its own
        // `&checkIn=...` etc. parsed as top-level /login query params
        // instead of part of `next`, truncating the redirect target).
        // autoConfirm=1 tells the effect below to retry this POST
        // automatically once we're back, and couponCode carries the applied
        // coupon across the login round-trip.
        const reviewParams = new URLSearchParams({
          roomTypeId,
          checkIn,
          checkOut,
          guests: String(guests),
          autoConfirm: "1",
        });
        if (couponCode) reviewParams.set("couponCode", couponCode);
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
  // re-apply the coupon (so the page shows the right total) and finish the
  // job automatically instead of waiting for a second click.
  useEffect(() => {
    if (autoConfirmRan.current) return;
    autoConfirmRan.current = true;
    const code = searchParams.get("couponCode");
    const autoConfirm = searchParams.get("autoConfirm") === "1";
    (async () => {
      const applied = code ? await validateCoupon(code) : null;
      if (!autoConfirm) return;
      if (code && !applied) return; // coupon no longer valid — let them decide
      handleConfirm(applied?.code);
    })();
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
          {coupon && (
            <div className="flex justify-between gap-4 text-[#1F7A45]">
              <dt>Coupon discount ({coupon.discountPercent}%)</dt>
              <dd id="review-discount-amount" className="font-semibold">
                −{formatINR(coupon.discountAmount)}
              </dd>
            </div>
          )}
        </dl>

        <div className="border-t border-dashed border-sera-line pt-5">
          <form onSubmit={handleApply} noValidate>
            <label htmlFor="coupon-code-input" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-sera-muted">
              Coupon code
            </label>
            <div className="flex gap-2">
              <input
                id="coupon-code-input"
                type="text"
                autoComplete="off"
                placeholder="Enter code"
                value={couponInput}
                disabled={!!coupon}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                className="h-12 min-w-0 flex-1 rounded-xl border border-[#D9D1C2] bg-white px-3.5 text-[15px] font-semibold uppercase tracking-wider text-sera-ink placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-[#9A9385] focus:border-sera-forest focus:outline-none focus:ring-2 focus:ring-sera-forest/15 disabled:bg-sera-cream"
              />
              {coupon ? (
                <button
                  id="coupon-remove-btn"
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="h-12 flex-none rounded-xl border border-sera-line px-4 text-sm font-semibold text-sera-muted hover:border-red-700 hover:text-red-700"
                >
                  Remove
                </button>
              ) : (
                <button
                  id="coupon-apply-btn"
                  type="submit"
                  disabled={applying}
                  className="h-12 flex-none rounded-xl bg-sera-ink px-5 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
                >
                  {applying ? "Checking…" : "Apply"}
                </button>
              )}
            </div>
          </form>
          {coupon && (
            <p id="coupon-success-message" className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-[#1F7A45]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {coupon.code} applied — you save {formatINR(coupon.discountAmount)}
            </p>
          )}
          {couponError && (
            <p id="coupon-error" role="alert" className="mt-2 text-sm font-medium text-red-700">
              {couponError}
            </p>
          )}
          {!coupon && !couponError && (
            <p className="mt-2 text-xs text-sera-muted">Find your coupon code in the WhatsApp message we sent you.</p>
          )}
        </div>

        <div className="flex items-end justify-between gap-4 border-t border-sera-line pt-5">
          <span className="text-sm font-semibold text-sera-ink">Total payable</span>
          <span className="text-right">
            {coupon && <span className="block text-sm text-sera-muted line-through">{formatINR(totalAmount)}</span>}
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
          onClick={() => handleConfirm()}
          disabled={loading || applying}
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
