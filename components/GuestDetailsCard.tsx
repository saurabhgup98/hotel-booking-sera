"use client";

import { useEffect, useState } from "react";
import { formatMobile } from "@/lib/constants";
import { readOfferLead, type OfferLead } from "@/lib/offerLead";

// Guest name + WhatsApp number from the landing offer form (localStorage),
// shown on the review step. Renders nothing for a visitor without one.
export default function GuestDetailsCard() {
  const [lead, setLead] = useState<OfferLead | null>(null);
  useEffect(() => setLead(readOfferLead()), []);
  if (!lead) return null;

  return (
    <div className="rounded-3xl border border-sera-line bg-white p-6">
      <h2 className="font-display text-xl text-sera-ink">Guest details</h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-sera-muted">Name</dt>
          <dd id="review-guest-name" className="mt-1 font-semibold text-sera-ink">
            {lead.name}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-sera-muted">WhatsApp</dt>
          <dd id="review-guest-whatsapp" className="mt-1 font-semibold tabular-nums text-sera-ink">
            {formatMobile(lead.whatsapp)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
