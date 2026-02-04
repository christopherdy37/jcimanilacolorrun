# How We Check Maya Amounts (Wrong / Incorrect Value)

If a customer enters the **wrong amount** on the Maya payment portal (e.g. pays ₱100 instead of ₱2000), here is how the app checks and what you can do.

---

## Maya does NOT include paid amount in success redirect URL

**Maya does not pass the paid amount** in the success redirect URL. So we **cannot** verify the amount from the redirect.

**What we do today:**

- We **do** pass the **correct amount** in the payment URL when we send the customer to Maya (from `createPaymentIntent`). Maya's page should show the right amount; the customer can still change it on their side.
- When the customer returns to our site (success redirect), we **do not** receive the amount back, so we **cannot** compare paid vs order total in the callback.
- We mark the order as completed when we get a success/invoice signal so customers are not stuck.
- **Do not set** `REQUIRE_AMOUNT_VERIFICATION=true` — Maya doesn't send amount, so that would make every payment fail with "amount unverified".

---

## 1. When the redirect DID include amount (not the case for Maya)

If the gateway **did** include the paid amount in the URL, we would:

- Read `amount` from the redirect URL.
- Compare it to the order total and reject with `amount_mismatch` if they don't match.

For Maya, this path is **not** used because the amount is not in the redirect.

---

## 2. What you can do without amount in redirect

**Option A – Rely on amount in payment URL (current)**

- We send the correct amount when redirecting to Maya. Rely on Maya to show/lock that amount where possible, and on customers paying the shown amount.
- Reconcile manually: compare **order total** in admin vs **amount received** in Maya dashboard or bank, and refund or contact customer if there's a mismatch.

**Option B – Maya API (future)**

- After the customer is redirected back, call **Maya's API** (e.g. get payment/invoice by transaction or reference ID) to get the **actual paid amount**.
- In the callback, only mark the order as paid if the API amount matches the order total; otherwise redirect to payment error.
- This requires Maya API credentials and a small code change in the callback.

**Option C – Webhook (if Maya sends one)**

- If Maya sends a **webhook** with the paid amount, we already validate it: we compare webhook amount to order total and reject if they don't match, so the order is not confirmed from the webhook.

---

## 3. Webhook (if Maya sends one)

If Maya sends a **webhook** (server-to-server) with payment details:

- We already validate the amount in the webhook handler when the payload includes an amount: we compare it to the order total and reject (e.g. return 400) if it doesn't match.
- So **wrong amounts in the webhook** are rejected and the order is not marked as paid from that webhook.

---

## 4. What you should do

1. **Do not set** `REQUIRE_AMOUNT_VERIFICATION=true` — Maya doesn't send amount in the redirect, so it would make every payment show "amount unverified".
2. **Manual reconciliation:** In admin, compare **order total** vs **amount in Maya dashboard** (or bank). Refund or contact the customer if someone paid the wrong amount.
3. **Optional later:** Implement **Maya API** in the callback: after redirect, call Maya to get the actual paid amount and only confirm the order if it matches the order total.

---

## Summary (Maya = no amount in redirect)

| Case | How we check | Result |
|------|----------------|--------|
| Redirect (Maya) | No amount in URL → **no check** | Order is confirmed when we get success/invoice |
| Webhook (if Maya sends amount) | Compare to order total | Reject if mismatch → order not confirmed |
| Strict mode `REQUIRE_AMOUNT_VERIFICATION=true` | **Do not use** with Maya | Would fail every payment (no amount in redirect) |
