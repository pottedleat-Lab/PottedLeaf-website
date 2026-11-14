<div align="center">

# 🪴 thePottedLeaf

**Online store for plants, pots and gardening tools**

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Razorpay](https://img.shields.io/badge/Payments-Razorpay-0C2451?logo=razorpay&logoColor=white)](https://razorpay.com/)

*Shop by category • Google login • UPI QR & card payments • Admin dashboard • Live stock*

**Live site:** https://potted-leaf.vercel.app

</div>

---

## 🎯 Overview

thePottedLeaf is the online shop of **VM Botanicals**, Kanpur. Customers browse plants by category, add them to a cart, and pay with UPI QR, credit card or debit card. The shop owner manages products, stock, orders, gallery photos and vlogs from an admin dashboard. Changes appear on the site straight away.

Full requirements: [REQUIREMENTS.md](REQUIREMENTS.md)

---

## 🏗️ Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│              Website — React + Vite (Vercel)                 │
│  Home · Shop · Product · Cart · Checkout · Orders · Vlogs    │
│  Gallery · Feedback · Policies · Login · Admin dashboard     │
└───────────────┬───────────────────────────────┬──────────────┘
                │ login only                    │ all data (REST + JWT)
                ▼                               ▼
        ┌───────────────┐            ┌─────────────────────────┐
        │ Supabase Auth │            │  API — Express + TS     │
        │ Google, email │            │  (Render)               │
        └───────────────┘            │  checks role & prices   │
                                     └──────┬───────────┬──────┘
                                            │           │
                                            ▼           ▼
                              ┌──────────────────┐  ┌──────────────┐
                              │ Supabase         │  │ Razorpay     │
                              │ Postgres + RLS   │  │ orders,      │
                              │ Storage (images) │  │ verification │
                              └──────────────────┘  └──────────────┘
```

The browser never talks to the database directly. The API holds the Supabase secret key and the Razorpay secret.

---

## ✨ Features

### 🛒 Shop
- Products listed by section: Office, Showcase, Flower, Fruit, Vegetable, Pots & Planters, Tools, Seeds
- Search, sort by price, and an "Only N left" / "Sold out" label based on live stock
- Cart saved in the browser; guests can browse and shop without an account

### 🔐 Accounts
- **Continue with Google** or email and password (Supabase Auth)
- Login required only at checkout; customers return to checkout after logging in
- My orders page with order status

### 💳 Payments
- Customer picks **UPI QR**, **Credit card** or **Debit card**; Razorpay shows only that method
- Total recalculated on the server from database prices (the browser's prices are never trusted)
- Razorpay signature verified on the server, then stock reduced in a single database transaction
- If an item sells out during payment, the order is marked failed and refunded automatically

### 🧑‍🌾 Admin dashboard (`/admin`)

| Tab | What it does |
|---|---|
| Add product | Photo, name, category, price, quantity, bio → live immediately |
| Inventory | +/− stock, edit details, change photo, hide/show, delete |
| Orders | Paid orders with address; mark shipped → delivered |
| Gallery | Upload several photos with a caption |
| Vlogs | Add YouTube videos |
| Feedback | Remove inappropriate reviews |

### 📄 Content & compliance
- Vlogs, photo gallery and a customer feedback wall
- Terms, Privacy, Refund & Cancellation, Shipping and Contact pages (needed for Razorpay verification)
- Business name, GSTIN and contact details in the footer

---

## 🛠️ Technology Stack

| Area | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, React Router |
| Backend | Node.js 22, Express, TypeScript, Zod validation |
| Database & storage | Supabase Postgres (Row Level Security), Supabase Storage |
| Auth | Supabase Auth (Google OAuth, email/password) |
| Payments | Razorpay Standard Checkout |
| Hosting | Vercel (website), Render (API) |
| Analytics | Vercel Web Analytics (cookie-free) |

---

## 📁 Project Structure

```text
client/                     # Website (React + Vite)
 ├── src/pages/             # Home, Shop, Product, Cart, Checkout, Orders, Vlogs, Gallery, Feedback, Policies, Auth
 ├── src/pages/admin/       # Add product, Inventory, Orders, Gallery, Vlogs, Feedback
 ├── src/components/        # Layout, ProductCard, Guards (login/admin), Stars
 ├── src/context/           # AuthContext, CartContext
 ├── src/lib/               # api.ts (one function per endpoint), categories, contact details
 └── vercel.json            # Lets page links work on refresh
server/                     # API (Express + TypeScript)
 ├── src/routes/            # public.ts, admin.ts, payments.ts
 ├── src/middleware/        # auth (Supabase token + admin check)
 └── src/lib/               # Supabase, Razorpay, image upload, env
supabase/schema.sql         # Tables, security policies, stock function, storage buckets, sample products
render.yaml                 # Render setup for the API
```

---

## 🚀 Quick Start (local)

### Prerequisites
- Node.js 22+
- A Supabase project (run `supabase/schema.sql` once in its SQL Editor)
- Razorpay **test** keys

### 1) Backend
```bash
cd server
cp .env.example .env      # Supabase URL + secret key, Razorpay key ID + secret
npm install
npm run dev               # http://localhost:4000/api/health
```

### 2) Website
```bash
cd client
cp .env.example .env      # API URL, Supabase URL + publishable key
npm install
npm run dev               # http://localhost:5173
```

Test payment: choose **Credit card** and use card `4386 2894 0766 0153`, any future expiry, any CVV and any OTP.

---

## ⚙️ Configuration

| Variable | Where | Value |
|---|---|---|
| `SUPABASE_URL` | server | `https://<project>.supabase.co` (no `/rest/v1`) |
| `SUPABASE_SERVICE_ROLE_KEY` | server | Supabase **secret** key (`sb_secret_…`) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | server | Razorpay API keys |
| `CLIENT_URL` | server | Website URL(s), comma-separated |
| `VITE_API_URL` | client | API URL |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | client | Supabase URL + **publishable** key (`sb_publishable_…`) |

Secrets go only in `server/.env` or in Render's environment settings, never in the website code or in git.

<details>
<summary><b>Google login setup</b></summary>

1. Google Cloud Console → **OAuth consent screen**: External, app name "thePottedLeaf". Publish it when going live.
2. **Credentials → OAuth client ID → Web application**
   - JavaScript origins: `http://localhost:5173`, `https://potted-leaf.vercel.app`
   - Redirect URI: `https://<project>.supabase.co/auth/v1/callback`
3. Supabase → Authentication → Providers → **Google**: paste the client ID and secret.
4. Supabase → Authentication → URL Configuration: Site URL = live site; Redirect URLs = `https://potted-leaf.vercel.app/**` and `http://localhost:5173/**`.
</details>

<details>
<summary><b>Admin access</b></summary>

**thepottedleafs@gmail.com** becomes admin automatically when it signs up (it's listed in the `admin_emails` table). To add another admin:

```sql
insert into public.admin_emails (email) values ('someone@example.com');
update public.profiles set role = 'admin'
where id = (select id from auth.users where lower(email) = lower('someone@example.com'));
```
</details>

<details>
<summary><b>Deployment (Vercel + Render)</b></summary>

1. **Render:** New → Blueprint → this repo (reads `render.yaml`). Add the server variables above. Check `/api/health` shows `{"ok":true}`.
2. **Vercel:** import the repo with Root Directory `client`, and add the client variables.
3. Set `CLIENT_URL` on Render to the Vercel URL.

Every push to `main` redeploys both. Render's free plan sleeps when nobody has visited for 15 minutes; the Starter plan stays awake.

**Going live with payments:** after Razorpay approves your KYC, replace the test keys on Render with live keys.
</details>

---

## 🔐 Security

| Concern | How it's handled |
|---|---|
| Prices | Recalculated on the server from the database at checkout |
| Payment fraud | Razorpay HMAC-SHA256 signature checked on the server |
| Stock | Reduced atomically in a Postgres function; overselling is refunded |
| Admin actions | Role checked on the server for every admin request |
| Data access | Row Level Security on every table; secret keys only on the server |
| Input | Validated with Zod on the server (phone, pincode, prices, uploads) |

---

<div align="center">

**thePottedLeaf** · a unit of VM Botanicals, Kanpur

</div>
