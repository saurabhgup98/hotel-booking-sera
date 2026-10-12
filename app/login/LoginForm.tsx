"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // A real SMS takes a few seconds: block a second click meanwhile.
  const [busy, setBusy] = useState(false);

  async function requestOtp() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to request OTP");
        return;
      }
      setMessage(data.message);
      setOtp("");
      setStep("otp");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function handleRequestOtp(e: FormEvent) {
    e.preventDefault();
    requestOtp();
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to verify OTP");
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto mt-12 max-w-sm space-y-5 rounded-3xl border border-sera-line bg-white p-7 shadow-xl shadow-black/5">
      <div>
        <h1 className="font-display text-2xl text-sera-ink">Login or create your account</h1>
        <p className="mt-1 text-sm text-sera-muted">We'll send a one-time code to verify your number.</p>
      </div>
      {message && <p className="text-sm text-[#1F7A45]">{message}</p>}
      {error && <p className="text-sm font-medium text-red-700">{error}</p>}

      {step === "mobile" ? (
        <form onSubmit={handleRequestOtp} className="space-y-3">
          <input
            id="login-mobile-input"
            type="tel"
            inputMode="numeric"
            required
            placeholder="Mobile number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 15))}
            className="h-12 w-full rounded-xl border border-[#D9D1C2] px-3.5 text-[15px] focus:border-sera-forest focus:outline-none focus:ring-2 focus:ring-sera-forest/15"
          />
          <button
            id="login-otp-request"
            type="submit"
            disabled={busy}
            className="h-12 w-full rounded-xl bg-sera-forest font-semibold text-white hover:bg-sera-forest-dark disabled:opacity-60"
          >
            {busy ? "Sending…" : "Send OTP"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-3">
          <input
            id="login-otp-input"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="h-12 w-full rounded-xl border border-[#D9D1C2] px-3.5 text-[15px] focus:border-sera-forest focus:outline-none focus:ring-2 focus:ring-sera-forest/15"
          />
          <p id="login-otp-hint" className="text-xs text-sera-muted">
            Sent by SMS to <strong className="text-sera-ink">{mobile}</strong>.{" "}
            <button
              id="login-otp-resend"
              type="button"
              disabled={busy}
              onClick={requestOtp}
              className="font-semibold text-sera-forest underline disabled:opacity-60"
            >
              Resend OTP
            </button>{" "}
            ·{" "}
            <button
              id="login-change-number"
              type="button"
              disabled={busy}
              onClick={() => {
                setStep("mobile");
                setMessage(null);
                setError(null);
              }}
              className="font-semibold text-sera-forest underline disabled:opacity-60"
            >
              Change number
            </button>
          </p>
          <button
            id="login-otp-submit"
            type="submit"
            disabled={busy}
            className="h-12 w-full rounded-xl bg-sera-forest font-semibold text-white hover:bg-sera-forest-dark disabled:opacity-60"
          >
            Verify &amp; Continue
          </button>
        </form>
      )}
    </div>
  );
}
