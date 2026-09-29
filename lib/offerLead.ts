import { OFFER_LEAD_STORAGE_KEY } from "@/lib/constants";

// The visitor's answers to the landing-page offer form, plus the two
// once-per-visitor flags described on OFFER_LEAD_STORAGE_KEY. Client-only
// (localStorage); every accessor tolerates storage being unavailable.
export type OfferLead = {
  name: string;
  whatsapp: string;
  checkIn: string;
  checkOut: string;
  guests: string;
  location: string;
  createdAt: string;
  offerSeen?: boolean;
  couponSent?: boolean;
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

// YYYY-MM-DD for today in the visitor's timezone — the `min` for date inputs.
export function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
