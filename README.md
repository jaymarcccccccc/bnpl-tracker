# Pay-later ledger

A small buy now, pay later tracker.

| Layer    | Tech                                   |
|----------|----------------------------------------|
| Frontend | Next.js 14 (App Router) + TypeScript   |
| Backend  | Python 3.11+ with FastAPI + SQLAlchemy |
| Database | PostgreSQL on Supabase                 |

**Features:** dashboard, add and manage purchases, monthly payment tracker, payment status
(paid / due soon / overdue / upcoming, worked out from the due date so it never goes stale).

## Run it

You need a free Supabase project, Python 3.11+, and Node 18.18+.

**1. Database (Supabase)**
1. Create a project at supabase.com and wait for it to finish provisioning.
2. Open **SQL Editor**, create a new query, paste the contents of `db/schema.sql`, and run it.
   This creates the `purchases` and `installments` tables and turns on Row Level Security.
3. Click **Connect** at the top of your project, copy the **Session pooler** connection string,
   and replace `[YOUR-PASSWORD]` with your database password (the one you set when creating the
   project; you can reset it under Project Settings, Database).

**2. Backend** (http://localhost:8000, API docs at `/docs`)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                  # then paste your connection string
uvicorn app.main:app --reload
python seed.py                                        # optional sample data (run in a second terminal)
```

Open http://localhost:8000/api/health. `{"ok": true}` means the backend can reach Supabase.

**3. Frontend** (http://localhost:3000)

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

## Supabase notes

- **How the backend connects:** straight to Postgres with the connection string, not through the
  Supabase client or API keys. Keep `DATABASE_URL` private and never put it in the frontend.
- **Which connection string:** the Session pooler works everywhere, including IPv4-only networks.
  The Direct connection is IPv6-only on the free plan. The Transaction pooler (port 6543) also works,
  because the backend turns off prepared statements.
- **Row Level Security:** `schema.sql` enables it with no policies. Supabase publishes tables to a
  public Data API, and this locks that API out of your data. The backend's database role bypasses RLS,
  so the app is unaffected. Add policies only if you later read the tables from the browser with Supabase Auth.
- **Tables are not auto-created.** If you see "relation purchases does not exist", run `db/schema.sql`.
- **Free projects pause** after a week of inactivity; restore it from the dashboard if the API stops connecting.

## How it works

Adding a purchase takes a total, a number of monthly payments and the first due date.
The backend splits the total to the cent (the last payment absorbs rounding) and creates one
`installments` row per month. Month-end dates are clamped: Jan 31 becomes Feb 28, then Mar 31.
Marking a payment paid sets `paid_on`; "Undo" clears it.

The browser only calls `/api/*` on the Next.js server, which forwards to FastAPI
(see `frontend/next.config.mjs`), so there is no CORS setup to fight with.

## API

| Method | Path                              | Purpose                                        |
|--------|-----------------------------------|------------------------------------------------|
| GET    | `/api/dashboard`                  | Totals, this month, up next, active purchases  |
| GET    | `/api/purchases`                  | All purchases with their schedules             |
| POST   | `/api/purchases`                  | Add a purchase and build its schedule          |
| GET    | `/api/purchases/{id}`             | One purchase                                   |
| PATCH  | `/api/purchases/{id}`             | Edit name, provider or notes                   |
| DELETE | `/api/purchases/{id}`             | Delete a purchase and its schedule             |
| GET    | `/api/installments?month=YYYY-MM` | Monthly tracker (current month adds late items)|
| POST   | `/api/installments/{id}/pay`      | Mark paid (optional `paid_on` date)            |
| POST   | `/api/installments/{id}/unpay`    | Undo                                           |

## Settings

- `NEXT_PUBLIC_CURRENCY` (frontend, default `PHP`): any ISO currency code.
- `API_URL` (frontend, default `http://localhost:8000`): where Next.js forwards `/api`.
- `DATABASE_URL` (backend): your Supabase connection string. `CORS_ORIGINS`: allowed browser origins.
- "Due soon" means due within 7 days (`DUE_SOON_DAYS` in `backend/app/services.py`).

## Ideas for later

Interest/fee fields, editing a schedule, weekly or biweekly payments, login and multiple
users, reminders by email.
