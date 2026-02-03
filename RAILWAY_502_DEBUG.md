# Debugging 502 on Railway

## 1. Check deployment logs (not build logs)

- In Railway: open your **service** → **Deployments** → click the latest deployment.
- Open the **Deploy** or **Runtime** tab (not **Build**).
- Look for:
  - "Listening on..." (app started)
  - Any **Error** or stack trace (crash)
  - Process exit code

502 usually means the app **crashed at runtime** or never listened on the right port. Build logs won’t show that.

## 2. Use the health check

- After deploy, open: `https://YOUR-RAILWAY-URL/api/health`
- If you get `{"status":"ok",...}` → app is running; 502 may be from another route or proxy.
- If you get 502 or timeout → app is not starting or is crashing.

## 3. Required environment variables (Railway)

Set these in Railway → your service → **Variables**:

| Variable         | Required | Notes                                      |
|------------------|----------|--------------------------------------------|
| `DATABASE_URL`   | Yes      | PostgreSQL connection string from Railway DB |
| `NEXTAUTH_SECRET`| Yes      | Random string (e.g. `openssl rand -base64 32`) |
| `NEXTAUTH_URL`   | Yes      | Your app URL, e.g. `https://xxx.railway.app`   |
| `PORT`           | No       | Railway sets this automatically             |

If `DATABASE_URL` or `NEXTAUTH_SECRET` is missing or wrong, the app can crash on startup or on first request.

## 4. How the app is started

- **With Docker:** `CMD ["node", "server.js"]` – Railway injects `PORT`.
- **Without Docker (Nixpacks):** `npm start` → `next start -H 0.0.0.0` so the app listens on all interfaces.

## 5. Common 502 causes

1. **Missing/wrong `DATABASE_URL`** – Prisma fails when the app hits the DB. Fix: add correct `DATABASE_URL` from Railway Postgres.
2. **Missing `NEXTAUTH_SECRET`** – NextAuth can fail. Fix: set a long random secret.
3. **Wrong `NEXTAUTH_URL`** – Should be your Railway app URL (e.g. `https://xxx.up.railway.app`).
4. **App not binding to `0.0.0.0`** – Fixed by `next start -H 0.0.0.0` in `package.json`.
5. **Crash on first request** – e.g. missing SMTP. The app now skips sending email if SMTP isn’t set instead of throwing.

## 6. Quick checklist

- [ ] Railway **Variables** include `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`.
- [ ] You’re reading **runtime/deploy logs**, not build logs.
- [ ] You opened `https://YOUR-APP/api/health` and checked the response.
- [ ] If using Postgres: DB service is running and linked; `DATABASE_URL` is the one Railway shows for that DB.
