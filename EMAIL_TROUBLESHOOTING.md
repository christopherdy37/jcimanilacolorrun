# Troubleshooting: Payment & Email Issues

## Transaction Stays PENDING (Customer Paid But DB Shows PENDING)

### Root cause (fixed)

The app was checking for `paymentStatus === 'paid'` in webhooks, but **Maya sends `PAYMENT_SUCCESS` or `CAPTURED`**, not `"paid"`. Webhooks were being ignored.

**Fix applied:** Webhook handlers now accept `PAYMENT_SUCCESS`, `CAPTURED`, and `PAID`.

### Webhook setup required

For reliable payment confirmation, **configure Maya webhooks** in Maya Manager:

1. Go to **Settings** → **Webhooks**
2. Add your webhook URL: `https://yoursite.com/api/payments/paymaya-callback` (POST) or `https://yoursite.com/api/payments/webhook`
3. Subscribe to **PAYMENT_SUCCESS** (and optionally PAYMENT_FAILED, PAYMENT_EXPIRED)

Maya recommends webhooks over redirects: *"Do not rely on redirect URLs or synchronous API responses."*

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

If PayMaya’s redirect URL does not include our `orderId`, the callback may fail before sending the email. Webhooks are more reliable.

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
