import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifySession } from "@/lib/auth";
import { AUTH_COOKIE_NAME } from "@/lib/constants";

export async function GET() {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({ user: { mobile: session.mobile } });
}

const nameSchema = z.object({ name: z.string().trim().min(1).max(60) });

// PUT: saves the name the guest typed into the offer form, so APTI's
// WhatsApp messages can greet them by it.
export async function PUT(request: Request) {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const parsed = nameSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  await connectDB();
  await User.updateOne({ _id: session.userId }, { $set: { name: parsed.data.name } });
  return NextResponse.json({ saved: true });
}
