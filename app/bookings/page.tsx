import Link from "next/link";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import { verifySession } from "@/lib/auth";
import { AUTH_COOKIE_NAME, formatINR, formatStayDate } from "@/lib/constants";
import { getCashbackBalance } from "@/lib/aptiCashback";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  confirmed: { label: "Confirmed", className: "bg-sera-mint text-sera-forest" },
  pending_payment: { label: "Awaiting payment", className: "bg-sera-brass-soft text-[#6E4C18]" },
  payment_failed: { label: "Payment failed", className: "bg-red-50 text-red-700" },
  cancelled: { label: "Cancelled", className: "bg-sera-cream text-sera-muted" },
};

export default async function BookingsPage() {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) {
    return <p className="mx-auto max-w-4xl px-4 pt-10 text-sera-muted sm:px-6">Please log in to see your bookings.</p>;
  }

  await connectDB();
  const [bookings, cashback] = await Promise.all([
    Booking.find({ userId: session.userId }).sort({ createdAt: -1 }).lean<any[]>(),
    getCashbackBalance(session.mobile),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 pt-10 sm:px-6">
      <h1 className="font-display text-4xl text-sera-ink">My Bookings</h1>
      {/* Referral cashback from APTI: the balance, and the id that goes in a
          referral link (shared from the WhatsApp booking message). */}
      <div
        id="referral-cashback-card"
        data-referral-id={cashback.referralId ?? undefined}
        className="flex flex-col gap-3 rounded-2xl border border-sera-line bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-sera-muted">Referral cashback</p>
          <p id="referral-cashback-balance" className="mt-1 text-2xl font-bold text-sera-ink">
            {formatINR(Math.floor(cashback.available))}
          </p>
          {cashback.pending > 0 && (
            <p className="text-xs text-sera-muted">+ {formatINR(Math.floor(cashback.pending))} after your friends&apos; check-in dates</p>
          )}
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-semibold uppercase tracking-wider text-sera-muted">Your referral ID</p>
          <p id="referral-id" className="mt-1 break-all font-mono text-sm text-sera-ink">
            {cashback.referralId ?? "Being set up — check back in a minute"}
          </p>
        </div>
      </div>
      {bookings.length === 0 && (
        <div className="rounded-3xl border border-sera-line bg-white p-8 text-center">
          <p className="text-sera-muted">No bookings yet.</p>
          <Link href="/" className="mt-3 inline-block font-semibold text-sera-forest hover:underline">
            Find a stay →
          </Link>
        </div>
      )}
      <ul className="space-y-3">
        {bookings.map((b) => {
          const status = STATUS_STYLES[b.status] ?? { label: b.status, className: "bg-sera-cream text-sera-muted" };
          return (
            <li key={b._id.toString()}>
              <Link
                href={`/booking/${b._id.toString()}`}
                className="flex flex-col gap-3 rounded-2xl border border-sera-line bg-white p-5 hover:border-sera-forest sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-sera-ink">
                    {b.hotelName} · {b.roomTypeName}
                  </p>
                  <p className="mt-1 text-sm text-sera-muted">
                    {formatStayDate(b.checkIn, false)} – {formatStayDate(b.checkOut)} · {b.guests}{" "}
                    {b.guests === 1 ? "guest" : "guests"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sera-ink">{formatINR(b.totalAmount)}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
