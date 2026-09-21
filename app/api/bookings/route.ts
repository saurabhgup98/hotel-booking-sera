import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import Hotel from "@/models/Hotel";
import Booking from "@/models/Booking";
import { verifySession } from "@/lib/auth";
import { AUTH_COOKIE_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

async function getSession() {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  return token ? await verifySession(token) : null;
}

const createSchema = z.object({
  hotelId: z.string(),
  roomTypeId: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
  guests: z.coerce.number().int().min(1),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid booking request" }, { status: 400 });
  }

  const { hotelId, roomTypeId, checkIn, checkOut, guests } = parsed.data;
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

  if (!Number.isFinite(nights) || nights <= 0) {
    return NextResponse.json({ error: "Check-out must be after check-in" }, { status: 400 });
  }

  await connectDB();
  const hotel = await Hotel.findById(hotelId).lean<any>();
  if (!hotel) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }
  const roomType = hotel.roomTypes.find((rt: any) => rt._id.toString() === roomTypeId);
  if (!roomType) {
    return NextResponse.json({ error: "Room type not found" }, { status: 404 });
  }

  const totalAmount = nights * roomType.pricePerNight;

  const booking = await Booking.create({
    userId: session.userId,
    hotelId: hotel._id,
    roomTypeId: roomType._id,
    hotelName: hotel.name,
    roomTypeName: roomType.name,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    guests,
    nights,
    totalAmount,
    status: "pending_payment",
    paymentResult: "pending",
  });

  return NextResponse.json({ bookingId: booking._id.toString() }, { status: 201 });
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  await connectDB();
  const bookings = await Booking.find({ userId: session.userId }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ bookings });
}
