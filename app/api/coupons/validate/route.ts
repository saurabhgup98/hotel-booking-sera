import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { applyCoupon } from "@/lib/coupons";

export const dynamic = "force-dynamic";

const schema = z.object({
  code: z.string().trim().min(1),
  amount: z.coerce.number().positive(),
});

// Preview only — no login needed and nothing is stored. POST /api/bookings
// re-validates the code and recomputes the discount server-side.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a coupon code" }, { status: 400 });
  }

  await connectDB();
  const applied = await applyCoupon(parsed.data.code, parsed.data.amount);
  if (!applied) {
    return NextResponse.json({ error: "This coupon code is invalid or has expired" }, { status: 404 });
  }
  return NextResponse.json(applied);
}
