# Eco Gifts API

NestJS API with Firebase Admin session authentication. It listens on port `4000` by default.

## Configuration

Copy `.env.example` to a local `.env` file through your deployment environment (the application reads environment variables directly). The API can boot without Firebase Admin credentials, but any Firebase-backed route or script will require either `FIREBASE_SERVICE_ACCOUNT` to be a complete JSON service-account object or `GOOGLE_APPLICATION_CREDENTIALS` to point to an available service-account JSON file. The Firebase service account needs Firebase Authentication Admin and Cloud Firestore access.

Set `FRONTEND_ORIGIN` to the exact browser origin allowed to make credentialed requests. Local development uses `http://localhost:3000`. Configure the frontend API base URL as `http://localhost:4000` (for example, `VITE_API_BASE_URL=http://localhost:4000`). Production must use HTTPS, `COOKIE_SECURE=true`, and a non-development `FRONTEND_ORIGIN`; when cross-site cookies are required, use `COOKIE_SAME_SITE=none` with HTTPS.

`ENABLE_DEMO_CARD_PAYMENTS=true` enables the existing development-only card
demonstration. The application refuses to start if that setting is enabled
with `NODE_ENV=production`. The demo never sends a card number or security
code to this API and is not a payment-provider integration.

## Authentication flow

Email/password sign-up and sign-in happen in the client using Firebase Client Auth. Exchange a freshly obtained Firebase ID token with this API:

1. `GET /api/auth/csrf` with `credentials: 'include'`; retain the returned token and browser cookie.
2. `POST /api/auth/session` with `{ "idToken": "..." }`, `credentials: 'include'`, and an `X-CSRF-Token` header.
3. Call `GET /api/auth/me` with `credentials: 'include'`.
4. Send the same CSRF header to `POST /api/auth/logout`.

The API stores the Firebase session in an HTTP-only cookie and validates CSRF with the double-submit cookie pattern. A first successful session exchange provisions a Firestore `users/{uid}` profile and grants the Firebase custom claim `role: "USER"` if no valid role claim exists. The only account roles are `USER` and `ADMIN`, and claims are changed only through trusted Firebase Admin code.

Use `@UseGuards(SessionAuthGuard, AdminGuard)` on admin controllers. `@CurrentUser()` supplies the verified session user.

`GET /api/admin/dashboard` and `/api/admin/products` are available only to `ADMIN` users. They read live Firestore data, and product mutations write audit records.

Legacy `CUSTOMER`, `STAFF`, and `SUPER_ADMIN` claims remain readable during migration. Run `npm run auth:migrate-roles` with `CONFIRM_ROLE_MIGRATION=eco-gifts-v2` to persist every account as `USER` or `ADMIN`.

## Commands

```bash
npm run start:dev
npm run build
npm test
npm run test:e2e
```

`GET /api/health` is the unauthenticated process-health endpoint. Other
Firebase-backed routes require configured Firebase Admin credentials.
