# Testing Orders & Google Sheets Without Real Payment

To test the full order flow (create order → “payment” → success page, email, and Google Sheets) **without paying real money through PayMaya**, use **test mode**.

## 1. Enable test mode

In your `.env` file add:

```env
PAYMENT_TEST_MODE=true
```

Restart your dev server (or redeploy) after changing env vars.

## 2. Run a test order

1. Open the site (e.g. `http://localhost:3000`).
2. Click **Buy Tickets** and pick a ticket.
3. Fill in the checkout form and submit.
4. Instead of going to PayMaya, you’ll land on a **Test payment** page with two options:
   - **Simulate successful payment** — marks the order paid, sends confirmation email (if configured), logs to Google Sheets with `[TEST]`, then shows the success page.
   - **Simulate failed payment** — sends you to the payment error page; the order stays **PENDING** (no email, no “payment completed” in Sheets).

Use both options to test success and failure flows without real money.

## 3. What gets logged

- **Database:** Order is `CONFIRMED` and `paymentStatus: COMPLETED`.
- **Google Sheets:** Same row as a real payment, with notes containing `[TEST]` so you can filter test rows.
- **Email:** Confirmation email is sent if email is set up.

## 4. Turn off test mode for production

Before going live, **remove or set** in `.env`:

```env
PAYMENT_TEST_MODE=false
```

Or delete the line. With test mode off, checkout will redirect to the real PayMaya payment page.

**Important:** Do **not** set `PAYMENT_TEST_MODE=true` in production (e.g. on Railway); anyone could complete “payments” without paying.

---

## What happens when payment fails on PayMaya (real flow)

When a user cancels or payment fails on PayMaya:

1. PayMaya redirects the user back to our site (without `status=success` or a valid payment).
2. Our callback does **not** mark the order as paid and redirects to **`/checkout/payment-error`**.
3. The order stays **PENDING** in the database; no confirmation email is sent; no “payment completed” row is written to Google Sheets.
4. The user sees the payment error page with **Try Again** (back to tickets) and **Return Home**.

We also show the error page when:
- The payment amount doesn’t match the order total (`?reason=amount_mismatch`).
- The order ID is missing or invalid.
