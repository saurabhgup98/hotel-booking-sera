"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function PaymentForm({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [upiId, setUpiId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/payments/${bookingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upiId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Payment failed to process");
        return;
      }
      router.push(`/booking/${bookingId}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        id="upi-id-input"
        type="text"
        required
        placeholder="yourname@upi"
        value={upiId}
        onChange={(e) => setUpiId(e.target.value)}
        className="w-full rounded border p-2"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        id="payment-submit-btn"
        type="submit"
        disabled={loading}
        className="w-full rounded bg-green-600 p-2 text-white disabled:opacity-50"
      >
        Pay Now
      </button>
    </form>
  );
}
