import Link from "next/link";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import { verifySession } from "@/lib/auth";
import { AUTH_COOKIE_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) {
    return <p className="text-slate-600">Please log in to see your bookings.</p>;
  }

  await connectDB();
  const bookings = await Booking.find({ userId: session.userId }).sort({ createdAt: -1 }).lean<any[]>();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">My Bookings</h1>
      {bookings.length === 0 && <p className="text-sm text-slate-500">No bookings yet.</p>}
      <ul className="space-y-3">
        {bookings.map((b) => (
          <li key={b._id.toString()} className="rounded-xl border bg-white p-4 shadow-sm">
            <Link href={`/booking/${b._id.toString()}`} className="font-medium text-slate-900 hover:text-indigo-600">
              {b.hotelName} — {b.roomTypeName}
            </Link>
            <p className="mt-1 text-sm text-slate-500">
              {new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()} ·{" "}
              {b.guests} guest(s) · Status:{" "}
              <span className="font-medium text-slate-700">{b.status}</span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
