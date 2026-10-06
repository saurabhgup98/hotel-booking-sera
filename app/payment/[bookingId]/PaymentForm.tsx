"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { formatINR } from "@/lib/constants";

const QR_VALID_SECONDS = 5 * 60;
// How long the "approve the request in your UPI app" screen shows before the
// (mock) payment is actually submitted — purely for a realistic demo feel.
const PROCESSING_DELAY_MS = 2200;

const UPI_APPS = [
  { name: "Google Pay", short: "G", className: "bg-white text-[#1A73E8] ring-1 ring-sera-line" },
  { name: "PhonePe", short: "Pe", className: "bg-[#5F259F] text-white" },
  { name: "Paytm", short: "Pt", className: "bg-[#E6F7FD] text-[#002E6E] ring-1 ring-[#BFE9F8]" },
  { name: "BHIM", short: "B", className: "bg-[#FDEEE2] text-[#B4520F] ring-1 ring-[#F8D5B8]" },
];

export default function PaymentForm({ bookingId, amount }: { bookingId: string; amount: number }) {
  const router = useRouter();
  const [upiId, setUpiId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(QR_VALID_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upiId.trim())) {
      setError("Enter a valid UPI ID, e.g. yourname@okhdfcbank");
      return;
    }
    setProcessing(true);
    try {
      await new Promise((r) => setTimeout(r, PROCESSING_DELAY_MS));
      const res = await fetch(`/api/payments/${bookingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upiId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Payment failed to process");
        setProcessing(false);
        return;
      }
      router.push(`/booking/${bookingId}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setProcessing(false);
    }
  }

  const mm = String(Math.floor(Math.max(secondsLeft, 0) / 60)).padStart(2, "0");
  const ss = String(Math.max(secondsLeft, 0) % 60).padStart(2, "0");

  return (
    <div className="relative p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-sera-ink">Pay using UPI</h1>
        <span className="rounded-full bg-sera-mint px-3 py-1 text-xs font-bold tracking-wider text-sera-forest">UPI</span>
      </div>

      <div className="mt-6 flex flex-col items-center gap-6 rounded-2xl border border-sera-line bg-sera-cream p-5 sm:flex-row sm:items-center">
        <div className="relative flex-none rounded-2xl bg-white p-3 ring-1 ring-sera-line">
          <FakeUpiQr seed={bookingId} />
          {secondsLeft <= 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/95">
              <p className="text-sm font-semibold text-sera-ink">QR expired</p>
              <button
                type="button"
                onClick={() => setSecondsLeft(QR_VALID_SECONDS)}
                className="rounded-lg bg-sera-forest px-3 py-1.5 text-xs font-semibold text-white hover:bg-sera-forest-dark"
              >
                Refresh QR
              </button>
            </div>
          )}
        </div>
        <div className="space-y-3 text-center sm:text-left">
          <p className="font-semibold text-sera-ink">Scan the QR with any UPI app</p>
          <div className="flex justify-center gap-2 sm:justify-start">
            {UPI_APPS.map((app) => (
              <span
                key={app.name}
                title={app.name}
                aria-label={app.name}
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${app.className}`}
              >
                {app.short}
              </span>
            ))}
          </div>
          <p className="text-xs text-sera-muted">
            QR valid for <span className="font-semibold tabular-nums text-sera-ink">{mm}:{ss}</span>
          </p>
        </div>
      </div>

      <div className="my-6 flex items-center gap-3 text-xs font-semibold tracking-widest text-[#A8A194]">
        <span className="h-px flex-1 bg-sera-line" />
        OR
        <span className="h-px flex-1 bg-sera-line" />
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        <label htmlFor="upi-id-input" className="block text-xs font-semibold uppercase tracking-wider text-sera-muted">
          Pay using UPI ID
        </label>
        <input
          id="upi-id-input"
          type="text"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="yourname@okhdfcbank"
          value={upiId}
          onChange={(e) => setUpiId(e.target.value)}
          className="h-12 w-full rounded-xl border border-[#D9D1C2] bg-white px-3.5 text-[15px] text-sera-ink placeholder:text-[#9A9385] focus:border-sera-forest focus:outline-none focus:ring-2 focus:ring-sera-forest/15"
        />
        {error && (
          <p role="alert" className="text-sm font-medium text-red-700">
            {error}
          </p>
        )}
        <button
          id="payment-submit-btn"
          type="submit"
          data-amount={amount}
          disabled={processing}
          className="w-full rounded-xl bg-sera-forest py-3.5 text-base font-semibold text-white hover:bg-sera-forest-dark disabled:opacity-60"
        >
          Pay {formatINR(amount)}
        </button>
        <p className="text-center text-xs text-sera-muted">You&apos;ll get a payment request in your UPI app.</p>
      </form>

      {processing && (
        <div role="status" aria-live="polite" className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/95 p-8 text-center animate-fade-in">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-sera-mint border-t-sera-forest" />
          <p className="font-display text-xl text-sera-ink">Waiting for payment…</p>
          <p className="max-w-xs text-sm text-sera-muted">
            Approve the request of <span className="font-semibold text-sera-ink">{formatINR(amount)}</span> sent to{" "}
            <span className="font-semibold text-sera-ink">{upiId.trim()}</span> in your UPI app.
          </p>
        </div>
      )}
    </div>
  );
}

// Decorative QR-style pattern (this is a mock checkout, there's no real UPI
// intent behind it). Deterministic per booking so it doesn't reshuffle on
// every render.
function FakeUpiQr({ seed }: { seed: string }) {
  const size = 25;
  const cells = useMemo(() => {
    let h = 2166136261;
    for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    const rand = () => {
      h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909);
      return ((h >>>= 0) % 1000) / 1000;
    };
    const inFinder = (x: number, y: number) =>
      (x < 8 && y < 8) || (x >= size - 8 && y < 8) || (x < 8 && y >= size - 8);
    const inLogo = (x: number, y: number) => x >= 10 && x <= 14 && y >= 10 && y <= 14;
    const out: { x: number; y: number }[] = [];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (!inFinder(x, y) && !inLogo(x, y) && rand() > 0.52) out.push({ x, y });
      }
    }
    return out;
  }, [seed]);

  const finder = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width="7" height="7" fill="#1C1B18" />
      <rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" />
      <rect x={x + 2} y={y + 2} width="3" height="3" fill="#1C1B18" />
    </g>
  );

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-36 w-36" shapeRendering="crispEdges" role="img" aria-label="UPI payment QR code">
      <rect width={size} height={size} fill="#fff" />
      {cells.map((c) => (
        <rect key={`${c.x}-${c.y}`} x={c.x} y={c.y} width="1" height="1" fill="#1C1B18" />
      ))}
      {finder(0, 0)}
      {finder(size - 7, 0)}
      {finder(0, size - 7)}
      <rect x="10" y="10" width="5" height="5" rx="1" fill="#1E4A42" />
      <text x="12.5" y="13.3" textAnchor="middle" fontSize="2.4" fontWeight="700" fill="#fff" fontFamily="sans-serif">
        UPI
      </text>
    </svg>
  );
}
