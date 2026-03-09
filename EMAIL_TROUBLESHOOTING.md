# Troubleshooting: Payment & Email Issues

## Why Payments Don't Complete (Root Cause Checklist)

Payments can be confirmed via **redirect** (user returns from Maya) or **webhook** (Maya sends server-to-server). If neither works, orders stay PENDING.

### 1. Webhook not configured (most common)

Maya must know where to send payment notifications. In **Maya Manager**:

- Go to **Settings** → **Webhooks**
- Add URL: `https://yoursite.com/api/payments/paymaya-callback` (POST)
- Subscribe to **PAYMENT_SUCCESS**
- Click **Save and Test**

Without this, you rely only on the redirect. If the user closes the browser before redirect, the order stays PENDING.

### 2. Redirect URL not preserved

Our success URL includes `orderId` and `status=success`. Maya should redirect to our exact URL. If Maya strips params or uses a different redirect, we may not get the success signal. Check server logs for `[PayMaya callback GET] No success signal` or `Order not found`.

### 3. Webhook can't find the order

We look up by: (a) `providerTransactionId` = webhook `id`, (b) `requestReferenceNumber` = order number, (c) `metadata.orderId`. If Maya sends a different `id` than our checkoutId and doesn't include `requestReferenceNumber`, we can't match. Check logs for `[PayMaya webhook] No matching transaction for`.

### 4. Ticket codes pool empty

If `ticket_codes` table has no unassigned codes, assignment fails. The order is still marked COMPLETED, but the email says "codes will follow." Add codes via `tickets:import` or manually.

### 5. Check server logs

Look for:

- `[PayMaya callback GET] Order not found` – redirect reached us but we couldn't find the order
- `[PayMaya callback GET] No success signal` – redirect lacked orderId/status=success
- `[PayMaya webhook] Ignored` – webhook received but payload didn't indicate success
- `[PayMaya webhook] No matching transaction` – webhook success but we couldn't match to an order

---

## Transaction Stays PENDING (Customer Paid But DB Shows PENDING)

### Root cause (fixed)

The app was checking for `paymentStatus === 'paid'` in webhooks, but **Maya sends `PAYMENT_SUCCESS` or `CAPTURED`**, not `"paid"`. Webhooks were being ignored.

**Fix applied:** Webhook handlers now accept `PAYMENT_SUCCESS`, `CAPTURED`, and `PAID`.

### Webhook setup required (most common fix)

For reliable payment confirmation, **configure Maya webhooks** in Maya Manager:

1. Go to **Settings** → **Webhooks**
2. Add your webhook URL: `https://yoursite.com/api/payments/paymaya-callback` (POST) or `https://yoursite.com/api/payments/webhook`
3. Subscribe to **PAYMENT_SUCCESS** (and optionally PAYMENT_FAILED, PAYMENT_EXPIRED)
4. Click **Save and Test** to verify reachability

Maya recommends webhooks over redirects: *"Do not rely on redirect URLs or synchronous API responses."*

If payments succeed in Maya but orders stay PENDING, the webhook is likely **not configured** or Maya cannot reach your URL (firewall, wrong domain, etc.).

### Optional: Maya API verification (redirect callback)

When `PAYMAYA_SECRET_KEY` is set, the redirect callback verifies payment status with Maya's API before marking the order complete. This adds an extra layer of certainty when redirect params are unreliable.

Add to `.env`:
```
PAYMAYA_SECRET_KEY=sk-your-secret-key
```

### Fixing an existing stuck order

If a customer already paid but the transaction is still PENDING:

1. Verify the payment in Maya Manager or your bank
2. In the database, update:
   - `payment_transactions.status` → `'COMPLETED'`
   - `orders.payment_status` → `'COMPLETED'`
   - `orders.status` → `'CONFIRMED'`
3. Use **Resend Confirmation Email** in Admin → Orders to send the receipt

---

## Customer Paid But Did Not Receive Confirmation Email

## Quick Fix: Resend the Email

1. Go to **Admin** → **Orders**
2. Find the order (search by order number, name, or email)
3. Open the order details
4. Click **Resend Confirmation Email**

The email will be sent again with the ticket number(s) and code(s) (if assigned).

---

## Possible Causes

### 1. SMTP Not Configured

If `SMTP_HOST`, `SMTP_USER`, or `SMTP_PASSWORD` is missing in production, emails are **silently skipped**.

**Check:** Look for this log at server startup:
```
[Email] SMTP not configured – missing: SMTP_HOST, SMTP_USER, SMTP_PASSWORD – receipt emails will not be sent
```

**Fix:** Add SMTP credentials to your `.env` (see `SMTP_SETUP.md`) and restart the server.

---

### 2. SMTP Send Failed

The email service may throw an error (invalid credentials, rate limit, etc.). The payment flow **still completes** and the customer sees the success page, but no email is sent.

**Check:** Look for these logs:
```
[Email] Send failed: <error message>
[PayMaya callback] Failed to send receipt email: <error>
```

**Fix:** Verify SMTP credentials, check your provider’s dashboard for delivery/errors, and ensure the sender email is verified.

---

### 3. Email in Spam / Promotions

The email may have been sent but filtered by the customer’s inbox.

**Fix:** Ask the customer to check spam, promotions, and other folders. Use **Resend Confirmation Email** from the admin panel to send again.

---

### 4. Wrong or Typo’d Email

The customer may have entered an incorrect email address.

**Fix:** Use **Resend Confirmation Email** after confirming the correct address with the customer. If needed, update the order’s email in the database and resend.

---

### 5. Ticket Codes Not Assigned

If the ticket code pool was empty or assignment failed, the email is still sent but says *"Your ticket code(s) will be sent in a follow-up email shortly."*

**Check:** Look for:
```
[TicketCodes] Not enough available codes to fully assign order: ...
[TicketCodes] Failed assigning ticket codes: ...
```

**Fix:** Add more ticket codes to the `ticket_codes` table, then use **Resend Confirmation Email** so the customer receives the codes.

---

### 6. PayMaya Redirect vs Webhook

Payment can be confirmed via:
- **GET callback:** User is redirected back from PayMaya with `orderId` in the URL
- **POST webhook:** PayMaya sends a server-to-server notification

If the’ user closes the browser before the redirect, or the redirect fails, the order stays PENDING. If the user closes the browser before the redirect, or the redirect fails, webhooks are more reliable (server-to-server). Webhook URL must be HTTPS and publicly accessible.

**Check:** Ensure your PayMaya checkout uses:
```
successUrl: https://yoursite.com/api/payments/paymaya-callback?orderId={orderId}&status=success
```

---

## When to Use Resend Email

- Customer reports they never received the confirmation
- You see `[Email] Send failed` or `[PayMaya callback] Failed to send receipt email` in logs
- SMTP was misconfigured and has since been fixed
- Ticket codes were added after the original purchase

The **Resend Confirmation Email** button appears on the order detail page for orders with **Payment Status: COMPLETED**.
