# SMTP Setup – Sending Receipt Emails

The app sends a **purchase receipt email** to the customer when payment is successful. To enable this, configure SMTP in your `.env` file.

## Required variables in `.env`

Add these (replace with your own values):

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-app-password-or-api-key
```

Optional (who the email appears “from”):

```env
SMTP_FROM=JCI Manila Color Run <noreply@yourdomain.com>
```

If you omit `SMTP_FROM`, the default is: `JCI Manila Color Run <noreply@jcimanilacolorrun.com>`.

---

## Provider examples

### Gmail

1. Turn on **2-Step Verification** in your Google account.
2. Create an **App Password**: Google Account → Security → 2-Step Verification → App passwords → generate one for “Mail”.
3. In `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_FROM=JCI Manila Color Run <your-gmail@gmail.com>
```

### Outlook / Microsoft 365

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-account-password
SMTP_FROM=JCI Manila Color Run <your-email@outlook.com>
```

### SendGrid

1. Create a SendGrid account and get an **API Key** (API Keys → Create API Key).
2. In `.env`:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM=JCI Manila Color Run <noreply@yourdomain.com>
```

### Mailgun

Use the SMTP credentials from Mailgun (Sending → Domain settings → SMTP credentials):

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASSWORD=your-mailgun-smtp-password
SMTP_FROM=JCI Manila Color Run <noreply@yourdomain.com>
```

### Brevo (formerly Sendinblue)

Sending → SMTP & API → SMTP:

```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-brevo-login-email
SMTP_PASSWORD=your-smtp-key
SMTP_FROM=JCI Manila Color Run <noreply@yourdomain.com>
```

---

## Ports

- **587** – TLS (recommended). Use this unless your provider says otherwise.
- **465** – SSL. The app treats port 465 as secure automatically.
- **25** – Unencrypted; many hosts block it. Prefer 587 or 465.

---

## After setting `.env`

1. Restart your dev server or redeploy (e.g. on Railway set the same variables in the project).
2. Run a test order with **test payment** (e.g. `PAYMENT_TEST_MODE=true`) and complete “Simulate successful payment”; the receipt email should be sent to the customer email you used.

If SMTP is not set, the app still runs but logs **“Email skipped (SMTP not configured)”** and no email is sent.

---

## Troubleshooting: receipt email not sent

1. **Check the terminal** where `npm run dev` is running after you complete a successful (test) payment:
   - **`[Email] SMTP not configured – missing: ...`** → Add the missing variables to `.env` and restart the server.
   - **`[Email] Skipped (SMTP not configured)`** → SMTP_HOST, SMTP_USER, or SMTP_PASSWORD is missing or empty.
   - **`[Email] Sent successfully to: ...`** → Email was sent; check the customer inbox and spam folder.
   - **`[Email] Send failed: ...`** or **`[PayMaya callback] Failed to send receipt email: ...`** → See step 2.

2. **If send failed** (wrong credentials or provider error):
   - **Brevo:** In Brevo go to **Sending** → **SMTP & API**. Use the **Login** (your Brevo account email) as `SMTP_USER` and the **SMTP key** as `SMTP_PASSWORD`. Ensure the sender email in **Senders & IP** is verified (e.g. use your Brevo account email in `SMTP_FROM` for testing).
   - **Gmail:** Use an [App Password](https://myaccount.google.com/apppasswords), not your normal password.
   - No spaces or quotes around values in `.env` unless the value itself contains spaces.

3. **Restart after changing `.env`**  
   Env vars are read when the server starts. After editing `.env`, stop the dev server (Ctrl+C) and run `npm run dev` again.

4. **Brevo sender verification**  
   If using Brevo, the “from” address may need to be verified. In Brevo: **Senders & IP** → add and verify your sender. For testing, set `SMTP_FROM=JCI Manila Color Run <your-brevo-login@example.com>` using the same email as `SMTP_USER`.
