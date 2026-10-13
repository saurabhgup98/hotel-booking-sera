"use client";

import { useEffect, useState } from "react";

// Shown when the customer opens the payment page from APTI's cart recovery
// WhatsApp (its link carries utm_campaign=cart_recovery). For testing: the
// booking confirmation WhatsApp (with the referral link) reaches them only
// after they've replied to the recovery message. Shown once per booking per
// browser tab.

const seenKey = (bookingId: string) => `sera_whatsapp_return_seen_${bookingId}`;

export default function WhatsappReturnNotice({ bookingId }: { bookingId: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(seenKey(bookingId))) return;
    } catch {
      // Storage blocked: just show it.
    }
    setOpen(true);
  }, [bookingId]);

  if (!open) return null;

  const close = () => {
    try {
      sessionStorage.setItem(seenKey(bookingId), "1");
    } catch {
      // Not remembered; it shows again on reload.
    }
    setOpen(false);
  };

  return (
    <div
      id="whatsapp-return-notice"
      role="dialog"
      aria-modal="true"
      aria-labelledby="whatsapp-return-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sera-brass">Before you pay</p>
        <h2 id="whatsapp-return-title" className="mt-1 text-xl font-bold text-sera-ink">
          One quick step to complete the test
        </h2>
        <ol className="mt-4 space-y-3 text-sm leading-relaxed text-sera-muted">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sera-mint text-xs font-bold text-sera-forest">1</span>
            <span>
              Reply <strong className="text-sera-ink">Yes</strong> or <strong className="text-sera-ink">OK</strong> to the booking
              recovery message you received on WhatsApp. This lets us send your booking confirmation there.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sera-mint text-xs font-bold text-sera-forest">2</span>
            <span>
              After replying, wait <strong className="text-sera-ink">about 1 minute</strong>, then complete the payment.
            </span>
          </li>
        </ol>
        <p className="mt-4 rounded-xl bg-sera-sand px-3.5 py-2.5 text-sm text-sera-ink">
          You&apos;ll then receive the booking confirmation on WhatsApp, with your referral link.
        </p>
        <button
          id="whatsapp-return-ok"
          type="button"
          onClick={close}
          autoFocus
          className="mt-5 h-12 w-full rounded-xl bg-sera-forest font-semibold text-white hover:bg-sera-forest-dark"
        >
          OK
        </button>
      </div>
    </div>
  );
}
