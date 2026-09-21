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
npm run seed                 # one-time: seeds 2 hotels x 2 room types
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
| `#hotel-card-{hotelId}` | `/` | a hotel card in the listing grid |
| `#hotel-details-btn-{hotelId}` | `/` | "View Details →" button on a hotel card |
| `#back-to-hotels-btn` | `/hotels/[id]` | "← Back to Hotels" button |
| `#search-checkin-input` | `/hotels/[id]` | shared search-widget check-in date (applies to every room type's booking) |
| `#search-checkout-input` | `/hotels/[id]` | shared search-widget check-out date |
| `#search-guests-input` | `/hotels/[id]` | shared search-widget guest count |
| `#room-type-{roomTypeId}` | `/hotels/[id]` | a room type card |
| `#book-now-btn` | `/hotels/[id]` | "Book" button — **only present on the first room type**; every room type's button also carries the `book-now-btn` class (a hotel page has 2 such buttons, one per room type, so only one can hold this literal id — use the class to target all of them). Clicking it uses the shared search widget's check-in/check-out/guests above, not per-room date fields. |
| `#upi-id-input` | `/payment/[bookingId]` | UPI id field |
| `#payment-submit-btn` | `/payment/[bookingId]` | "Pay Now" button |
| `#booking-confirmed-banner` | `/booking/[bookingId]` | shown only on a successful payment |
| `#payment-failed-banner` | `/booking/[bookingId]` | shown only on a rejected payment |
| `#logout-btn` | header, when logged in | logout button |
