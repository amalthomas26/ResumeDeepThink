# Auth, Personalization & Tier Enforcement

## The core tension
You want: 3 free checks with zero friction (no login), +2 more for logging in, and login should feel optional, not gated. But "no login" usage limits are inherently gameable — anyone can clear cookies. The goal isn't to make this unbeatable (impossible without login-walling everything, which you don't want), it's to make casual abuse inconvenient enough that it doesn't matter, while never blocking a genuine user who just cleared their cookies once.

## Anonymous tracking (the 3 free checks)
Use a **combination**, not any single signal alone:
1. A long-lived, signed HTTP-only cookie with a random device ID (primary signal, survives normal browsing).
2. A coarse fingerprint (IP address + User-Agent hash) as a secondary signal, stored server-side in Redis with the check count, keyed independently of the cookie.
3. Count = max of what either signal reports, not sum — if the cookie says 1 used and the IP/UA fingerprint says 3 used, trust the higher number (assume the cookie was cleared to dodge the limit).

Do **not** try to fingerprint harder than this (canvas fingerprinting, etc.) — it's disproportionate for a 3-check freemium limit, adds real privacy/creepiness cost, and the honest majority of users you'd inconvenience with false positives (shared office IPs, mobile carriers with shared IPs) far outnumber the few who'd bypass a soft limit anyway. Treat the anonymous limit as a *speed bump* that funnels people toward login for more value, not a hard wall.

## Login (optional, personalized)
- **Method**: Email + OTP as the primary path (no OAuth app review needed, works for a solo builder day one). Add "Continue with Google" once you have some traction — one-click sign-in meaningfully lifts conversion, but isn't necessary to ship v1.
- **What "personalized" means concretely**: on login, migrate the anonymous device's check history to the account (don't discard it — losing a first-time user's just-generated results at the exact moment you ask them to log in is a guaranteed drop-off point). Remember their resume type selection, show a score history/trend if they check the same resume version more than once, and let the AI insight prompt reference prior check results ("you fixed the keyword issue from last time — nice").
- **The +2 checks on login must be one-time per account**, not per session — track it as a boolean flag on the user record (`bonusChecksGranted: true`), not a counter that could be re-triggered.

## Combined limit logic (single source of truth)
One `UsageModule` function, called before any check starts:
```
if (loggedIn):
    allowed = 5 (or premium cap) - checksUsedThisPeriod
else:
    allowed = 3 - checksUsedByDeviceOrFingerprint
```
Never let two different code paths (e.g. frontend button disabling + backend validation) diverge on this logic — implement the check server-side as the source of truth, and have the frontend read the *result* of an availability endpoint rather than re-implementing the counting logic in Zustand. A client-side-only limit is not a limit at all.

## Edge cases to handle explicitly
- **Shared devices/IPs (cyber cafés, colleges, offices)**: because you use max(cookie, fingerprint) rather than pure IP blocking, a cleared cookie on a shared IP still gets a fresh per-cookie count — this is deliberately a bit generous, which is correct for a freemium funnel (you want trials, not to be a fortress).
- **Login without using all anonymous checks**: migrate remaining anonymous checks too, don't reset to a fresh 2 — e.g. used 1 of 3 anonymously, login grants 2 more → 4 total remaining, not 2.
- **Logout/login with a different account on the same device**: the device fingerprint's anonymous count should not carry over to a *second* logged-in account's separate quota — once any account has logged in on a device, subsequent quota is account-based, not device-based.
- **Account deletion and re-signup with the same email**: don't let deleting and recreating an account reset the free-tier bonus — key the "already granted bonus" state off the email hash persisted independently of the user row's lifecycle (a lightweight `claimed_bonuses` table keyed by hashed email, kept even if the user row is deleted), otherwise this becomes a free unlimited-checks loophole.
- **Multiple resumes per user**: the check limit is per check performed, not per unique resume — re-checking the same resume after edits still consumes a check. This is expected and fine; don't over-engineer "free re-checks of the same file," it undermines the premium upsell.