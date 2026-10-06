# hotel-booking (sandbox, branded "Sera Hotels and Resorts")

A throwaway Next.js + MongoDB Atlas site used to give the website-tracking
SDK a realistic login/booking/payment flow to inject into and test against.
Not part of the production APTI product. The deployed site itself is
branded as "Sera Hotels and Resorts" and its user-facing copy deliberately reads
like a real hotel-booking site (no "dummy"/"sandbox"/"test" wording on the
live pages) — this README and the tables below are the internal-only
reference for the SDK team.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in MONGODB_URI and JWT_SECRET
npm run seed                 # seeds/renames 4 "Sera …" hotels (2 per city); safe to re-run
npm run dev                  # http://localhost:3000
```

## Deploy to Vercel

This app lives in a monorepo (`dummy-test-sites/hotel-booking`). When
importing the project in Vercel, set **Project Settings → General → Root
Directory** to `hotel-booking`. Add `MONGODB_URI` and `JWT_SECRET` as
Environment Variables (Production + Preview). Run `npm run seed` once,
locally, pointed at the Atlas connection string (not as a Vercel build step).

## Login / OTP

There is no real SMS integration — the OTP is always the fixed value below.
The first successful OTP verify for a mobile number also registers it (no
separate register step, no name required):

- **Fixed OTP:** `123456`

The live UI no longer echoes this value in the "OTP sent" response message —
`123456` (documented here) is the only value `verify-otp` accepts.

## Offer / WhatsApp flow (demo)

1. First visit to any page except login/payment/booking pages → **10 seconds after
   landing**, a non-dismissable offer modal (name, WhatsApp number, dates, guests,
   location). The WhatsApp number must be OTP-verified (Send OTP → `123456`, any
   other OTP fails) — verifying also logs the visitor in (same `/api/auth/*` as `/login`). Submitting it
   also fills the home-page filter form, then shows a "Creating your offer" loader
   and a **"Today's Offer — Up to X% off"** popup. The form is asked once per browser
   (localStorage `sera_offer_lead`, not cleared on logout — clear it by hand to
   replay the demo); the popup comes back **once a day** (first visit of the day,
   same 10-second delay) with that day's "up to" discount.
2. The visitor's **first room "Book Now" of the day** shows a "Check your WhatsApp"
   popup before going to review, and asks APTI to send the offer on WhatsApp (see
   below). Later Book Now clicks that day skip both.
3. Review page applies **today's actual discount automatically** — no coupon
   field. It's read server-side by both the review page and `POST /api/bookings`
   (which stores `originalAmount`, `discountLabel`, `discountAmount`,
   `totalAmount` = payable), so the browser never decides the price.

### Today's discount — `/api/discount`

One setting for the whole site (MongoDB `discountsettings`, `key: "current"`):

| Field | Meaning |
|---|---|
| `todaysDiscount` | shown in the offer popup as "Up to …" |
| `actualDiscount` | what checkout really takes off, and what the WhatsApp message quotes |

Each is `{ "type": "percent" | "amount", "value": <number> }` — e.g. `4` % or
₹`350` flat. It stays until changed (no midnight reset). Until a setting is
saved, the defaults are up to 5% / actual 4%.

| Call | Who | Body |
|---|---|---|
| `GET /api/discount` | anyone | → `{ todaysDiscount }` (with the admin key: also `actualDiscount`, `isDefault`, `updatedAt`) |
| `POST /api/discount` | admin | `{ "todaysDiscount": {...}, "actualDiscount": {...} }` — create (409 if it exists) |
| `PATCH /api/discount` | admin | either or both fields — change |

Admin calls need the header `x-admin-key: <DISCOUNT_ADMIN_KEY>`.

### WhatsApp offer message (via APTI)

The site never talks to WhatsApp. On the first room "Book Now" of the day the
browser calls `POST /api/whatsapp/offer` (`{ name }`); the server takes the
**number from the login session** (the OTP-verified one) and the actual
discount from the database, and calls APTI:

```
POST <APTI_WHATSAPP_SEND_URL>          (APTI: /whatsapp/site-send)
x-apti-key: <APTI_API_KEY>            (the site's API key, same as the SDK's)
{
  "siteId": "<APTI_SITE_ID>",
  "template": "room_booking_deduction_update",
  "label": "Book Now (first of the day)",
  "contacts": [{ "to": "91XXXXXXXXXX", "variables": { "body_1": "<name>", "body_2": "4%" } }]
}
```

APTI checks the key exactly like the SDK does (key active, site active, key
belongs to `siteId`), then sends from the WhatsApp number linked to the site.
Max 10 contacts per call. While `APTI_WHATSAPP_SEND_URL` is unset the call is
skipped (logged in the browser console) and booking carries on.

| Env var | |
|---|---|
| `DISCOUNT_ADMIN_KEY` | protects POST/PATCH `/api/discount` |
| `APTI_WHATSAPP_SEND_URL` | APTI's send endpoint (unset = skip) |
| `APTI_API_KEY` | the site's APTI API key (the `apk_…` key in the SDK script tag) |
| `APTI_SITE_ID` | this site's APTI site ID (`8e13eea4-1457-440a-a64a-07a9cf809d10`) |
| `APTI_WHATSAPP_TEMPLATE` | optional, default `room_booking_deduction_update` |

## Mock payment

At the payment step, any UPI ID is accepted. The outcome is decided by
matching it (case-insensitively, trimmed) against two lists in
`lib/constants.ts`:

- **Forces approval:** `success@upi`, `approve@oksbi`, `testpass@ybl`
- **Forces rejection:** `failure@upi`, `reject@oksbi`, `testfail@ybl`
- **Anything else:** defaults to **approved**.

## Stable DOM ids (for SDK `EventRule` configuration)

| id | Where | Meaning |
|---|---|---|
| `#login-mobile-input` | `/login` | mobile number field |
| `#login-otp-request` | `/login` | "Send OTP" button |
| `#login-otp-input` | `/login` | OTP field |
| `#login-otp-submit` | `/login` | "Verify & Continue" button |
| `#nav-home-link` | header | "Home" nav item — a link, or non-clickable active text on `/` |
| `#nav-bookings-link` | header, when logged in | "My Bookings" nav item — a link, or non-clickable active text on `/bookings` |
| `#nav-mobile-number` | header, when logged in | logged-in user's mobile number, shown to the right of the logo, always visible (no longer hidden on small screens) |
| `#home-filter-checkin-input` | `/` | home-page filter: check-in date |
| `#home-filter-checkout-input` | `/` | home-page filter: check-out date |
| `#home-filter-guests-input` | `/` | home-page filter: guest count |
| `#home-filter-location-select` | `/` | home-page filter: location (city), default "All Locations" shows all hotels |
| `#home-filter-error` | `/` | shown when "View Details" is clicked before check-in/check-out/guests are filled |
| `#home-filter-clear-btn` | `/` | "Clear filters" button — resets and clears the persisted filter values |
| `#hotel-card-{hotelId}` | `/` | a hotel card in the listing grid |
| `#hotel-details-btn-{hotelId}` | `/` | "View Details →" button on a hotel card — carries the home-page filter values forward via query string once they're filled |
| `#back-to-hotels-btn` | `/hotels/[id]` | "← Back to Hotels" button |
| `#hotel-address` | `/hotels/[id]` | hotel's display address |
| `#hotel-reviews-section` / `.review-item` | `/hotels/[id]` | guest reviews section / each individual review row |
| `#search-checkin-input` | `/hotels/[id]` | shared search-widget check-in date (applies to every room type's booking; pre-filled from the home-page filter if carried over via query string) |
| `#search-checkout-input` | `/hotels/[id]` | shared search-widget check-out date |
| `#search-guests-input` | `/hotels/[id]` | shared search-widget guest count |
| `#room-type-{roomTypeId}` | `/hotels/[id]` | a room type card |
| `#book-now-btn` | `/hotels/[id]` | "Book Now" button — **only present on the first room type**; every room type's button also carries the `book-now-btn` class (a hotel page has 2 such buttons, one per room type, so only one can hold this literal id — use the class to target all of them). Clicking it navigates to the `/hotels/[id]/review` preview step — it no longer creates a booking directly. |
| `#confirm-booking-btn` | `/hotels/[id]/review` | "Pay Now · ₹…" button — this is the point a `pending_payment` Booking is actually created |
| `#review-back-btn` | `/hotels/[id]/review` | "← Change room or dates" link, back to the hotel page with filters preserved |
| `#upi-id-input` | `/payment/[bookingId]` | UPI id field |
| `#payment-submit-btn` | `/payment/[bookingId]` | "Pay Now" button |
| `#booking-confirmed-banner` | `/booking/[bookingId]` | shown only on a successful payment |
| `#payment-failed-banner` | `/booking/[bookingId]` | shown only on a rejected payment |
| `#logout-btn` | header, when logged in | logout button |
| `#offer-lead-form` | offer modal (any page, first visit) | the offer details form |
| `#offer-name-input` / `#offer-whatsapp-input` | offer modal | guest name / WhatsApp number (not validated) |
| `#offer-checkin-input` / `#offer-checkout-input` / `#offer-guests-input` / `#offer-location-select` | offer modal | stay details (copied into the home-page filters on submit) |
| `#offer-send-otp-btn` / `#offer-otp-input` / `#offer-verify-otp-btn` | offer modal | send OTP / OTP field / verify (only `123456` passes) |
| `#offer-otp-verified` / `#offer-otp-error` | offer modal | shown once verified / on a wrong OTP |
| `#offer-submit-btn` | offer modal | "Curate my offer" submit (requires a verified number) |
| `#offer-creating-loader` | overlay | "Creating your offer…" loader |
| `#offer-popup` / `#offer-book-now-btn` | overlay | "Today's Offer" popup / its Book Now |
| `#whatsapp-coupon-popup` | `/hotels/[id]` | "Check your WhatsApp" popup — appears only on the visitor's first room Book Now; carries `data-guest-name` and `data-whatsapp-number` |
| `#whatsapp-popup-number` / `#whatsapp-popup-ok-btn` | `/hotels/[id]` | number shown in that popup / its OK button |
| `#review-offer-applied` | `/hotels/[id]/review` | "4% discount applied — you save ₹…" banner (only when there's an offer) |
| `#review-discount-amount` / `#review-total-amount` | `/hotels/[id]/review` | discount line / total payable |
| `#review-guest-name` / `#review-guest-whatsapp` | `/hotels/[id]/review` | guest details from the offer form |
| `#payment-amount` | `/payment/[bookingId]` | amount payable (after today's discount) |
