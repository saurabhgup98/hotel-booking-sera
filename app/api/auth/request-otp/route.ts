import { NextResponse } from "next/server";
import { z } from "zod";
import { sendOtp } from "@/lib/aptiOtp";

const schema = z.object({
  mobile: z.string().trim().min(6).max(15).regex(/^\d+$/, "Mobile number must contain digits only"),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid mobile number" }, { status: 400 });
  }

  // A real SMS: APTI makes the code, texts it and later checks it
  // (lib/aptiOtp.ts) — nothing is stored here.
  const result = await sendOtp(parsed.data.mobile);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ message: "OTP sent to your mobile number." });
}
