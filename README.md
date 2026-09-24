# hotel-booking (sandbox, branded "SeraStay Hotels")

A throwaway Next.js + MongoDB Atlas site used to give the website-tracking
SDK a realistic login/booking/payment flow to inject into and test against.
Not part of the production APTI product. The deployed site itself is
branded as "SeraStay Hotels" and its user-facing copy deliberately reads
like a real hotel-booking site (no "dummy"/"sandbox"/"test" wording on the
live pages) — this README and the tables below are the internal-only
reference for the SDK team.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in MONGODB_URI and JWT_SECRET
npm run seed                 # one-time: seeds 4 hotels x 2 room types (2 per city)
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
| `#nav-mobile-number` | header, when logged in | logged-in user's mobile number, always visible (no longer hidden on small screens) |
| `#home-filter-checkin-input` | `/` | home-page filter: check-in date |
| `#home-filter-checkout-input` | `/` | home-page filter: check-out date |
| `#home-filter-guests-input` | `/` | home-page filter: guest count |
| `#home-filter-location-select` | `/` | home-page filter: location (city), default "All Locations" shows all hotels |
| `#home-filter-error` | `/` | shown when "View Details" is clicked before check-in/check-out/guests are filled |
| `#hotel-card-{hotelId}` | `/` | a hotel card in the listing grid |
| `#hotel-details-btn-{hotelId}` | `/` | "View Details →" button on a hotel card — carries the home-page filter values forward via query string once they're filled |
| `#back-to-hotels-btn` | `/hotels/[id]` | "← Back to Hotels" button |
| `#hotel-address` | `/hotels/[id]` | hotel's display address |
| `#hotel-reviews-section` / `.review-item` | `/hotels/[id]` | guest reviews section / each individual review row |
| `#search-checkin-input` | `/hotels/[id]` | shared search-widget check-in date (applies to every room type's booking; pre-filled from the home-page filter if carried over via query string) |
| `#search-checkout-input` | `/hotels/[id]` | shared search-widget check-out date |
| `#search-guests-input` | `/hotels/[id]` | shared search-widget guest count |
| `#room-type-{roomTypeId}` | `/hotels/[id]` | a room type card |
| `#book-now-btn` | `/hotels/[id]` | "Review Booking" button — **only present on the first room type**; every room type's button also carries the `book-now-btn` class (a hotel page has 2 such buttons, one per room type, so only one can hold this literal id — use the class to target all of them). Clicking it navigates to the `/hotels/[id]/review` preview step — it no longer creates a booking directly. |
| `#confirm-booking-btn` | `/hotels/[id]/review` | "Confirm & Pay" button — this is the point a `pending_payment` Booking is actually created |
| `#review-back-btn` | `/hotels/[id]/review` | "← Change room or dates" link, back to the hotel page with filters preserved |
| `#upi-id-input` | `/payment/[bookingId]` | UPI id field |
| `#payment-submit-btn` | `/payment/[bookingId]` | "Pay Now" button |
| `#booking-confirmed-banner` | `/booking/[bookingId]` | shown only on a successful payment |
| `#payment-failed-banner` | `/booking/[bookingId]` | shown only on a rejected payment |
| `#logout-btn` | header, when logged in | logout button |
