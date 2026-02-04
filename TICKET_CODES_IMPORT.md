# Importing Ticket Numbers & Codes (from Google Sheets)

Your physical ticket list (Ticket Number + Code) can be stored in a Google Sheet and imported into the database as a one-time pool. Each paid order will then reserve unique codes from this pool (no duplicates).

## 1. Prepare your Google Sheet

In your spreadsheet (the same `GOOGLE_SHEETS_ID` or a separate one), create a tab (sheet) named:

- `TicketCodes` (default) — or any name you want

Put the data in columns:

- **Column A:** Ticket Number
- **Column B:** Code

Row 1 can be headers like: `Ticket Number | Code`

## 2. Set env vars

You already have:

- `GOOGLE_SHEETS_ID`
- `GOOGLE_SHEETS_CREDENTIALS`

Add (optional) env vars if your tab/range differs:

```env
TICKET_CODES_SHEET_NAME=TicketCodes
TICKET_CODES_RANGE=A:B
```

## 3. Apply the database change

Because we added the `TicketCode` table, run one of these:

```bash
npm run db:migrate
```

or, if you prefer schema push (no migration files):

```bash
npm run db:push
```

## 4. Run the import

```bash
npm run tickets:import
```

The importer will:

- Read the sheet range
- Skip the header row if it looks like headers
- Insert into `ticket_codes`
- **Skip duplicates** safely

## 5. Verify

Open Prisma Studio:

```bash
npm run db:studio
```

Check the `TicketCode` table — `orderId` should be empty for unassigned codes.

