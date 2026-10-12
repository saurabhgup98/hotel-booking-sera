import { notFound, redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { verifySession } from "@/lib/auth";
import { AUTH_COOKIE_NAME, SITE_NAME } from "@/lib/constants";
import { getCashbackBalance } from "@/lib/aptiCashback";
import ReferShare from "./ReferShare";

export const dynamic = "force-dynamic";

// Where the "Refer on WhatsApp" button of APTI's booking-confirmed WhatsApp
// lands (…/refer/<referral id>). Opens WhatsApp's share screen straight away
// with the guest's referral link, so they only pick contacts.
//
// "me" = APTI hadn't seen the guest log in when it sent the message: their
// referral id is looked up after they log in here.

const REFERRAL_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ME = "me";

export default async function ReferPage({ params }: { params: { refId: string } }) {
  let referralId: string | null = params.refId;

  if (params.refId === ME) {
    const token = cookies().get(AUTH_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;
    if (!session) redirect(`/login?next=${encodeURIComponent(`/refer/${ME}`)}`);
    referralId = (await getCashbackBalance(session.mobile)).referralId;
  } else if (!REFERRAL_ID.test(params.refId)) {
    notFound();
  }

  if (!referralId) {
    return (
      <div id="refer-page" className="mx-auto max-w-md px-4 pt-16 text-center sm:px-6">
        <h1 className="font-display text-3xl text-sera-ink">Your referral link is being set up</h1>
        <p className="mt-3 text-sera-muted">Please try again in a minute.</p>
      </div>
    );
  }

  const host = headers().get("x-forwarded-host") ?? headers().get("host");
  const proto = headers().get("x-forwarded-proto") ?? "https";
  const link = `${proto}://${host}/?utm_source=whatsapp&utm_medium=apti_referral&ref_id=${referralId}`;
  const message = `Hey! Book your stay at ${SITE_NAME} using my link: ${link}`;

  return <ReferShare message={message} link={link} />;
}
