import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Hotel from "@/models/Hotel";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { hotelId: string } }) {
  if (!mongoose.isValidObjectId(params.hotelId)) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }

  await connectDB();
  const hotel = await Hotel.findById(params.hotelId).lean();
  if (!hotel) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }
  return NextResponse.json({ hotel });
}
