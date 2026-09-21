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
    return <p>Please log in to see your bookings.</p>;
  }

  await connectDB();
  const bookings = await Booking.find({ userId: session.userId }).sort({ createdAt: -1 }).lean<any[]>();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My Bookings</h1>
      {bookings.length === 0 && <p className="text-sm text-gray-500">No bookings yet.</p>}
      <ul className="space-y-2">
        {bookings.map((b) => (
          <li key={b._id.toString()} className="rounded border bg-white p-3">
            <Link href={`/booking/${b._id.toString()}`} className="font-medium">
              {b.hotelName} — {b.roomTypeName}
            </Link>
            <p className="text-sm text-gray-500">
              {new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()} · Status:{" "}
              {b.status}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
