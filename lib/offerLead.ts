import { OFFER_FORM_CLOSED_STORAGE_KEY, OFFER_LEAD_STORAGE_KEY } from "@/lib/constants";

// The visitor's answers to the landing-page offer form, plus the two
// once-per-day markers described on OFFER_LEAD_STORAGE_KEY. Client-only
// (localStorage); every accessor tolerates storage being unavailable.
export type OfferLead = {
  name: string;
  whatsapp: string;
  checkIn: string;
  checkOut: string;
  guests: string;
  location: string;
  createdAt: string;
  // Local date (YYYY-MM-DD) the "Today's Offer" popup was last acknowledged
  offerSeenOn?: string;
  // Local date the first room "Book Now" last sent the WhatsApp offer
  couponSentOn?: string;
  whatsappVerified?: boolean;
};

export function readOfferLead(): OfferLead | null {
  try {
    const raw = localStorage.getItem(OFFER_LEAD_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OfferLead) : null;
  } catch {
    return null;
  }
}

export function writeOfferLead(lead: OfferLead) {
  try {
    localStorage.setItem(OFFER_LEAD_STORAGE_KEY, JSON.stringify(lead));
  } catch {}
}

export function updateOfferLead(patch: Partial<OfferLead>) {
  const lead = readOfferLead();
  if (lead) writeOfferLead({ ...lead, ...patch });
}

// YYYY-MM-DD for today in the visitor's timezone — the `min` for date inputs,
// and the "already done today" marker for the offer popup and WhatsApp.
export function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export const offerSeenToday = (lead: OfferLead | null) => lead?.offerSeenOn === todayISO();
export const couponSentToday = (lead: OfferLead | null) => lead?.couponSentOn === todayISO();

// The offer form's ✕: closed for the rest of today, asked again tomorrow.
export function markOfferFormClosedToday() {
  try {
    localStorage.setItem(OFFER_FORM_CLOSED_STORAGE_KEY, todayISO());
  } catch {}
}

export function offerFormClosedToday() {
  try {
    return localStorage.getItem(OFFER_FORM_CLOSED_STORAGE_KEY) === todayISO();
  } catch {
    return false;
  }
}
