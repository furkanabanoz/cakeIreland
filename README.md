# CakeIreland

CakeIreland is a Next.js App Router storefront using PostgreSQL and Prisma for products, carts, orders and payments. Stripe Checkout handles card payments; the Stripe webhook at `/api/stripe/webhook` confirms paid orders. Next.js Cache Components are enabled, so request-specific routes use `connection()`/Suspense rather than `dynamic = "force-dynamic"`.

## Local setup

1. Copy `.env.example` to `.env` and provide local PostgreSQL, Stripe test-mode and email provider values.
2. Install dependencies with `npm ci`.
3. Apply migrations and seed development data:

   ```bash
   npx prisma migrate dev
   npm run db:seed
   ```

4. Start the app with `npm run dev`.

For local Stripe webhooks, run `stripe listen --forward-to localhost:3000/api/stripe/webhook` and set `STRIPE_WEBHOOK_SECRET` to the signing secret printed by the Stripe CLI. Keep test and live API keys and webhook secrets separate.

## Validation

```bash
npx prisma validate
npx prisma generate
npx tsc --noEmit
npm run lint
npm run build
```

The build requires a reachable PostgreSQL database and the required Stripe and Resend environment variables.

## Production checklist

- Apply migrations with `npx prisma migrate deploy` against the production database only after reviewing the migration and taking a backup.
- Configure the public site URL, support email, production database, Stripe live keys, and the exact Stripe endpoint `https://<domain>/api/stripe/webhook`.
- Configure the Stripe endpoint's `STRIPE_WEBHOOK_SECRET` from that endpoint, and subscribe it to the event types handled by the route.
- Configure the Resend sender domain and verify SPF/DKIM/DMARC independently.
- Configure daily database backups and perform a restore test.
- Complete legal-business identity, retention and consumer policy details with an Irish professional before publishing the draft legal pages.
- Test checkout, duplicate webhook delivery, payment failure, account permissions and mobile layouts in the deployed environment before enabling live payments.

`NEXT_PUBLIC_GA_MEASUREMENT_ID` is optional; analytics is loaded only after a visitor accepts analytics cookies. `NEXT_PUBLIC_SUPPORT_EMAIL` must point to a monitored customer support address before launch.

## Admin image uploads

Product images and category hero images can still be entered as URLs. To enable file uploads, create a Cloudflare R2 bucket and a bucket-scoped R2 API token with Object Read & Write access. Connect a custom domain to the bucket (recommended for production) or enable the public development URL for testing, then configure these server-only environment variables:

- `CLOUDFLARE_R2_ACCOUNT_ID`: Cloudflare account ID.
- `CLOUDFLARE_R2_ACCESS_KEY_ID` and `CLOUDFLARE_R2_SECRET_ACCESS_KEY`: credentials from the R2 API token; store them only in the deployment's secret manager.
- `CLOUDFLARE_R2_BUCKET_NAME`: target bucket.
- `CLOUDFLARE_R2_PUBLIC_URL`: HTTPS bucket-domain origin with no path or query parameters (for example, `https://images.example.com`).

The app's authenticated upload endpoint re-checks the user's database role, caps uploads at 5 MB, accepts raster JPEG/PNG/WebP/GIF/AVIF only, and checks the file signature before saving under a random object key. Uploaded images are publicly viewable on the configured domain; do not upload private or sensitive images. Browser-to-R2 CORS is not needed because uploads pass through the authenticated app server. Uploads remain unavailable until valid bucket credentials and a public HTTPS URL are configured. Replacing/removing a URL in product or category content does not delete its old R2 object; configure an R2 lifecycle policy or plan periodic orphan cleanup if storage usage requires it.
