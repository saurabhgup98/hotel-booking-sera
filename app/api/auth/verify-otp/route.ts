import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { signSession } from "@/lib/auth";
import { AUTH_COOKIE_NAME, TEST_OTP } from "@/lib/constants";
import { verifyOtp } from "@/lib/aptiOtp";

const schema = z.object({
  mobile: z.string().trim().min(6).max(15).regex(/^\d+$/, "Mobile number must contain digits only"),
  otp: z.string(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { mobile, otp } = parsed.data;
  // Checked by APTI, which sent it (lib/aptiOtp.ts) — except the test code
  // TEST_OTP, accepted for any number (for numbers that get no SMS).
  if (otp.trim() !== TEST_OTP) {
    const result = await verifyOtp(mobile, otp.trim());
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
  }

  await connectDB();

  // This IS the register path: a mobile number with no existing User is
  // created on first successful verify — no separate register step needed
  // for this site (unlike the WordPress site, which needs a name).
  let user = await User.findOne({ mobile });
  if (!user) {
    user = await User.create({ mobile });
  }

  const token = await signSession({ userId: user._id.toString(), mobile: user.mobile });

  const response = NextResponse.json({ message: "Logged in", mobile: user.mobile });
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
