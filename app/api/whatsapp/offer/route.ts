import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifySession } from "@/lib/auth";
import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { formatDiscount } from "@/lib/discount";
import { getTodaysOffer } from "@/lib/todaysOffer";

// Asks APTI to send the "today's offer" WhatsApp to the signed-in visitor.
// Called by the browser on the visitor's first room "Book Now" of the day.
//
// The site never talks to WhatsApp itself: APTI's POST /whatsapp/site-send
// checks the site's API key (the same one the SDK uses — it must be active,
// and so must the site), then sends from the WhatsApp number linked to
// APTI_SITE_ID. Runs here, server-side, so the number is always the one the
// visitor verified with OTP (from the session cookie), never one the browser
// sends.
//
// With APTI_WHATSAPP_SEND_URL unset the call is skipped and the booking flow
// carries on as normal.

export const dynamic = "force-dynamic";

const TEMPLATE = process.env.APTI_WHATSAPP_TEMPLATE || "room_booking_deduction_update";
const TIMEOUT_MS = 8000;

const schema = z.object({ name: z.string().trim().min(1).max(100) });

// "9876543210" → "919876543210" (WhatsApp needs the country code)
function withCountryCode(mobile: string) {
  const digits = mobile.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

export async function POST(request: Request) {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) {
    return NextResponse.json({ sent: false, reason: "Not signed in" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ sent: false, reason: "Invalid request" }, { status: 400 });
  }

  const url = process.env.APTI_WHATSAPP_SEND_URL;
  const apiKey = process.env.APTI_API_KEY;
  const siteId = process.env.APTI_SITE_ID;
  if (!url || !apiKey || !siteId) {
    return NextResponse.json({ sent: false, reason: "APTI WhatsApp sending is not configured yet" });
  }

  const discount = await getTodaysOffer();
  const payload = {
    siteId,
    template: TEMPLATE,
    // Shown as the trigger on the brand's WhatsApp records page
    label: "Book Now (first of the day)",
    contacts: [
      {
        to: withCountryCode(session.mobile),
        // Template: "Hello {{1}}, an authorized deduction of {{2}} has been applied ..."
        variables: { body_1: parsed.data.name, body_2: formatDiscount(discount) },
      },
    ],
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-apti-key": apiKey },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      console.error("[whatsapp/offer] APTI refused the send", res.status, body);
      return NextResponse.json({ sent: false, reason: `APTI returned ${res.status}` }, { status: 502 });
    }
    return NextResponse.json({ sent: true, apti: body });
  } catch (err) {
    console.error("[whatsapp/offer] Could not reach APTI", err);
    return NextResponse.json({ sent: false, reason: "Could not reach APTI" }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
