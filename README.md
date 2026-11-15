# WealthFlow - MERN Expense Tracker

MongoDB + Express + React (Vite) + Node. JWT login, transactions, categories, budgets, goals,
analytics, calendar, reports (Excel/CSV export) and settings, with light / dark / system themes.

```
wealthflow-mern/
  backend/    Express API + MongoDB (Mongoose)
  frontend/   React app (Vite)
```

## Run it

**Backend** (terminal 1)
```bash
cd backend
npm install
cp .env.example .env        # first time only, then edit MONGO_URI and JWT_SECRET
npm run dev                 # http://localhost:5000
```

**Frontend** (terminal 2)
```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

> Updating from an older copy? Run `npm install` in `backend/` again (new packages: `compression`, `nodemailer`),
> and add the optional email lines from `.env.example` to your existing `.env`.

## What's new in this version

| Request | What changed |
|---|---|
| Negative balance in red | Total Balance is **red** when below 0 (badge: "Overspent"), **orange** when under 20% of income ("Low balance") |
| Income / expense colors | Total Income number is **green**; Total Expenses number is **red** (card outline + "More than income" badge when expenses exceed income). Savings rate: red below 0, orange below 20%, green otherwise |
| Income on dashboard | The overview donut now has an **Expenses / Income** switch |
| Add category button | **Add category** link inside the Add/Edit transaction form (name + color, saved and selected instantly). The category list also follows the Type you choose, so income no longer shows up inside expenses |
| Messy legend | Legend is a fixed 3-column grid (name / amount / %), long names are trimmed, many categories scroll |
| Forgot password | Login -> **Forgot password?** -> emailed reset link (valid 15 min) -> new password |
| Mobile number | Optional field on sign up and in Settings |
| Theme | Settings -> Appearance: **Light / Dark / System default** (follows your device live) |
| Faster loading | See "Speed" below |
| Goal colors | Full color picker + **R / G / B** inputs + hex, plus quick swatches (also used for categories) |
| Sidebar animation | The highlight **glides** from one title to the next; pages fade in |
| Day on dates | Every date shows the weekday, e.g. `Wed, 04 Nov 2026` |
| Excel export | Reports -> **Export transactions (with day)**: `Date, Day, Title, Category, Type, Amount, Payment Method, Notes`. A separate summary export is also available |

Also fixed: "Amount" and "Method" columns were stuck together, a wrong password on the login page reloaded the page
without showing an error, and a wrong *current* password in Settings logged you out.

## Latest fixes

| Request | What changed |
|---|---|
| Popup title hidden / box pushed down | Popups (Add transaction, Add budget, Add category, ...) now open **centred on the whole screen** with the title always visible. Tall popups scroll. Esc closes them |
| Gray overlay | Replaced with a soft blurred background (dark in dark mode, frosted white in light mode). Change it with `--overlay` in `index.css` |
| Donut text hidden / overlapping | The hover tooltip is gone. Hover a slice (or a legend row) and its name, amount and % appear **inside the donut** |
| Latest transaction first | Transactions are sorted newest first: by date, then by the time they were added |
| Add Transaction on dashboard | Button at the top right of the dashboard, same form as the Transactions page |
| Click titles to open the tab | "Recent Transactions", "All Transactions", "Budget Overview" and "Goals Overview" titles (and their **View all** links) open that tab |
| Goals on dashboard | New **Goals Overview** card under Budget Overview |
| Budget category can't be changed | The category can now be changed when editing. Categories that already have a budget this month are greyed out |
| Analytics breakdown | Month and total shown in the card header, column headings (Category / Share / Amount), colour dot and % per row |

## Forgot password - email setup

Works out of the box in development: if no email server is configured, the reset link is **printed in the backend
terminal** and shown on the Forgot password page. To send real emails, fill these in `backend/.env`
(any SMTP provider - Gmail app password, Brevo, Mailgun, ...):

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=WealthFlow <you@gmail.com>
```
Set `NODE_ENV=production` when deploying so the link is never shown on screen.

## Speed

Backend
- `GET /api/dashboard/overview` returns the whole dashboard in **one request** (was 5), with all queries running in parallel
- Budgets use one aggregation instead of one query per budget
- Read queries use `.lean()`, extra database indexes, gzip compression, connection pool

Frontend
- Cached data shows **instantly**, then refreshes quietly (skeleton placeholders instead of a blank "Loading...")
- Pages and chart library load as separate small files, only when needed
- Sidebar stays mounted between pages; hovering a menu item (and idle time after login) pre-loads that page's data
- Logged-in user is remembered, so the app no longer waits for a server check before drawing

If it still feels slow, the usual cause is the **database location**: use a MongoDB Atlas cluster in a region near
you (e.g. Mumbai `ap-south-1`) or a local MongoDB while developing. `npm run build` + `npm run preview` in `frontend/`
is also noticeably faster than `npm run dev`.

## API

All routes except register / login / forgot / reset need `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | name, email, password, optional phone |
| POST | /api/auth/login | returns token |
| POST | /api/auth/forgot-password | `{ email }` |
| POST | /api/auth/reset-password/:token | `{ password }` |
| GET / PUT | /api/auth/me | profile (name, phone, currency) |
| PUT | /api/auth/change-password | `{ currentPassword, newPassword }` |
| GET / POST / PUT / DELETE | /api/categories | CRUD |
| GET / POST / PUT / DELETE | /api/transactions | CRUD, `?category=&type=&page=&limit=` |
| GET / POST / PUT / DELETE | /api/budgets | CRUD, `?month=&year=` |
| GET / POST / PUT / DELETE | /api/goals | CRUD (+ `POST /:id/contribute`) |
| GET | /api/dashboard/overview | everything the dashboard needs |
| GET | /api/dashboard/calendar | daily totals for a month |
| GET | /api/analytics/monthly-trend | last N months income / expense / net |
| GET | /api/analytics/category-report | totals per category **plus the transactions** for a date range |
