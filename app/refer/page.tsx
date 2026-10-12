import { redirect } from "next/navigation";

// /refer?ref_id=<id> (the link shape in the WhatsApp template's example) →
// /refer/<id>; no id → the logged-in guest's own.
export default function ReferQueryPage({ searchParams }: { searchParams: { ref_id?: string } }) {
  redirect(`/refer/${encodeURIComponent(searchParams.ref_id || "me")}`);
}
