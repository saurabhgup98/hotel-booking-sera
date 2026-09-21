import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  mobile: z.string().trim().min(6).max(15),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid mobile number" }, { status: 400 });
  }

  // Mocked: no real SMS is sent and nothing is written to the DB — the OTP
  // is a fixed constant checked in /api/auth/verify-otp.
  return NextResponse.json({ message: "OTP sent — use 123456" });
}
