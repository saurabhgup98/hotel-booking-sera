import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Hotel from "@/models/Hotel";

export const dynamic = "force-dynamic";

export async function GET() {
  await connectDB();
  const hotels = await Hotel.find({}).lean();
  return NextResponse.json({ hotels });
}
