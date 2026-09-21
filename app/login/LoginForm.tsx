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

  async function handleRequestOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);
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
    setStep("otp");
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);
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
  }

  return (
    <div className="mx-auto max-w-sm space-y-4 rounded-2xl border bg-white p-6 shadow-md">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Login or create your account</h1>
        <p className="mt-1 text-sm text-slate-500">We'll send a one-time code to verify your number.</p>
      </div>
      {message && <p className="text-sm text-green-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {step === "mobile" ? (
        <form onSubmit={handleRequestOtp} className="space-y-3">
          <input
            id="login-mobile-input"
            type="tel"
            required
            placeholder="Mobile number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="w-full rounded-lg border p-2.5 focus:border-indigo-600 focus:outline-none"
          />
          <button
            id="login-otp-request"
            type="submit"
            className="w-full rounded-lg bg-indigo-600 p-2.5 font-medium text-white hover:bg-indigo-700"
          >
            Send OTP
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-3">
          <input
            id="login-otp-input"
            type="text"
            required
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full rounded-lg border p-2.5 focus:border-indigo-600 focus:outline-none"
          />
          <button
            id="login-otp-submit"
            type="submit"
            className="w-full rounded-lg bg-indigo-600 p-2.5 font-medium text-white hover:bg-indigo-700"
          >
            Verify &amp; Continue
          </button>
        </form>
      )}
    </div>
  );
}
