import { aptiBase } from "@/lib/aptiEngage";

// Login OTP by real SMS, through APTI (POST /sdk/v1/otp/send and
// /otp/verify, secret key, server-side only). APTI makes the code, texts it
// with its own SMS setup and checks it — this site keeps no codes. APTI also
// limits resends (30 s apart, 5 an hour) and wrong tries (5 per code).
//
// With APTI_TRACK_URL or APTI_SECRET_KEY unset, login can't work and both
// say so.

const TIMEOUT_MS = 10000;

export type OtpResult = { ok: true } | { ok: false; status: number; error: string };

async function call(path: "send" | "verify", body: object): Promise<OtpResult> {
  const base = aptiBase();
  const key = process.env.APTI_SECRET_KEY;
  if (!base || !key) return { ok: false, status: 503, error: "Login by OTP isn't available right now" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${base}/sdk/v1/otp/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-apti-key": key },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      // APTI's own message for the customer's mistakes (wrong / expired
      // code, too many tries); a generic one for anything on our side.
      const clientError = res.status === 400 || res.status === 429;
      if (!clientError) console.error(`[aptiOtp] ${path} refused`, res.status, json?.error?.msg);
      return {
        ok: false,
        status: clientError ? res.status : 502,
        error: clientError && json?.error?.msg ? json.error.msg : "Couldn't reach the OTP service. Please try again.",
      };
    }
    return { ok: true };
  } catch (err) {
    console.error(`[aptiOtp] ${path} failed`, err);
    return { ok: false, status: 502, error: "Couldn't reach the OTP service. Please try again." };
  } finally {
    clearTimeout(timer);
  }
}

export const sendOtp = (mobile: string) => call("send", { mobile });

export const verifyOtp = (mobile: string, otp: string) => call("verify", { mobile, otp });
