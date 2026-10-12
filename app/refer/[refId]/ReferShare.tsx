"use client";

import { useEffect, useState } from "react";

// Opens WhatsApp's share screen (pick contacts, message pre-filled) as soon
// as the page loads. Some browsers block opening an app without a tap, so
// the same link is also a button.
export default function ReferShare({ message, link }: { message: string; link: string }) {
  const shareUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.location.href = shareUrl;
  }, [shareUrl]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {}
  }

  return (
    <div id="refer-page" className="mx-auto max-w-md space-y-6 px-4 pt-16 text-center sm:px-6">
      <div>
        <h1 className="font-display text-3xl text-sera-ink">Refer a friend</h1>
        <p className="mt-2 text-sera-muted">Opening WhatsApp so you can pick who to send it to…</p>
      </div>
      <p id="refer-message" className="rounded-2xl border border-sera-line bg-white p-4 text-left text-sm text-sera-ink">
        {message}
      </p>
      <a
        id="refer-whatsapp-btn"
        href={shareUrl}
        className="block rounded-xl bg-[#1F7A45] py-3.5 text-base font-semibold text-white hover:bg-[#18603A]"
      >
        Share on WhatsApp
      </a>
      <button
        id="refer-copy-btn"
        type="button"
        onClick={copyLink}
        className="w-full rounded-xl border border-sera-line bg-white py-3 text-sm font-semibold text-sera-ink hover:border-sera-forest"
      >
        {copied ? "Link copied" : "Copy my link"}
      </button>
    </div>
  );
}
