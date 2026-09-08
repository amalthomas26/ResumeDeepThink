# Payment Integration (India, no GST)

## The real constraint, stated plainly
You don't need a payment gateway that "supports no GST" as a special product feature — you need one that offers **Individual/unregistered KYC onboarding**, using just your PAN card and a personal bank account, instead of the standard Private Ltd/LLP + GST certificate path. This exists at the major, legitimate gateways; it's just a different signup track with lower limits, not a different product.

**Ignore any gateway marketing itself specifically as "the GST-free gateway"** (you'll find several in a search, with names like "zero-GST payment gateway") — established players don't lead with that framing because it's not really a distinct feature, and a business built entirely around that pitch is a red flag for reliability/payout risk, not a shortcut worth taking for something that will hold your users' subscription payments.

## Recommended: Cashfree Payments, Individual KYC
- Onboards individuals/proprietors with PAN + bank account, no GST certificate required at this tier.
- Supports **subscriptions/recurring payments** (UPI Autopay + card e-mandates) — you need this, since ₹49/month and ₹549/year are recurring plans, not one-off purchases. Confirm current subscription-API support and individual-tier transaction caps directly on their onboarding docs before building against it, since limits and KYC tiers get revised.
- Good UPI support, which will be the dominant payment method for a ₹49/month Indian consumer product by a wide margin — optimize the checkout for UPI first, cards second.

**Fallback: PayU or Instamojo**, both of which also support individual/freelancer onboarding with just PAN-level KYC. Keep this as a documented fallback in your code (an interface your `PaymentModule` implements, not a hard dependency on one SDK) so switching gateways later — likely once you register a business and want better rates — isn't a rewrite.

## GST registration threshold (know this number, don't need to act on it yet)
Registration is mandatory only once your aggregate annual turnover crosses **₹20 lakh** for services (₹10 lakh in a few special-category states). At ₹49-549 per user, you'd need roughly 3,000+ paying monthly subscribers before this becomes a real compliance question — cross that bridge when you're there, and get a CA at that point rather than guessing. Don't let this be a launch blocker.

## Subscription lifecycle you must model (not just "take a payment")
1. **Order creation** → user selects monthly/yearly → your backend creates a Cashfree order/subscription, never trust an amount sent from the frontend (always set the price server-side from a `PLANS` config, keyed by plan ID, so a tampered client request can't pay ₹1 for premium).
2. **Webhook verification** → Cashfree (like all serious gateways) signs webhook payloads; verify the signature server-side before trusting *any* payment-success event. This is the one place "no security" is not an option regardless of how simple you want the rest of the build — an unverified webhook endpoint is a direct "grant myself premium for free" exploit, not a hardening nice-to-have.
3. **Idempotency** → webhooks can be delivered more than once for the same event; key your subscription-activation logic off the gateway's unique payment/order ID so a duplicate webhook doesn't double-grant or double-log anything.
4. **Renewal failure** → recurring payments fail sometimes (expired card, insufficient balance, bank declines UPI Autopay). Don't hard-cut access the instant a renewal fails — give a short grace period (e.g. 3 days) with a "payment failed, update your method" banner, then downgrade to free. Hard-cutting on the first failed renewal generates support tickets and lost revenue from users who'd have fixed it themselves in a day or two.
5. **Cancellation** → let users cancel anytime; premium access should continue until the end of the *paid* period, not end immediately (standard SaaS expectation, and legally cleaner under Indian consumer protection norms for recurring digital subscriptions).
6. **Refunds** → decide and publish a simple policy before launch (e.g. "no refunds after 7 days, full refund within 7 days if unused") rather than improvising per-request — an unwritten policy means every refund request becomes a judgment call, which doesn't scale even at low volume.

## "No security, use directly" — the one place to push back
Read charitably, this instruction means "don't make me build enterprise-grade PCI infrastructure" — which is correct and achievable: **use Cashfree's hosted checkout page/SDK**, so card numbers and UPI credentials never touch your servers at all. That's not a security shortcut, it's the standard, correct architecture — PCI-DSS compliance becomes the gateway's problem, not yours, by construction. What can't be skipped no matter how simple you keep everything else: (a) webhook signature verification, and (b) server-side price enforcement. Both are a few lines of code, not an infrastructure project, and skipping either turns "keep it simple" into "let anyone get premium for free."