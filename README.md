# PottedLeaf

Online plant & pot store. React frontend (`client/`), TypeScript/Express backend (`server/`), Supabase (DB + auth + storage), Razorpay payments.

Full requirements: [REQUIREMENTS.md](REQUIREMENTS.md)

```
client/    React + Vite + TypeScript (port 5173)
server/    Express + TypeScript API (port 4000)
supabase/  schema.sql — tables, RLS, storage buckets, sample products
```

## Setup

### 1. Supabase
1. Create a project at https://supabase.com.
2. **SQL Editor** → paste and run all of `supabase/schema.sql`. This creates the tables, the stock function, the `product-images` and `gallery` storage buckets, and 16 sample products.
3. **Project Settings → API**: copy the Project URL, `anon` key and `service_role` key.
4. (For quick local testing) **Authentication → Providers → Email**: turn off "Confirm email" so new accounts can log in right away.

### 2. Razorpay
1. Sign up at https://dashboard.razorpay.com and switch to **Test mode**.
2. **Settings → API Keys** → generate a key ID and secret.
3. (Optional) **Settings → Webhooks** → URL `https://<your-server>/api/payments/webhook`, event `payment.captured`, and set a secret.

### 3. Backend
```bash
cd server
cp .env.example .env      # fill in Supabase + Razorpay values
npm install
npm run dev               # http://localhost:4000/api/health
```

### 4. Frontend
```bash
cd client
cp .env.example .env      # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev               # http://localhost:5173
```

### 5. Admin account
**thepottedleafs@gmail.com** is the admin. `schema.sql` lists it in the `admin_emails` table, so:
- if that email signs up after the schema is run, it becomes admin automatically;
- if it already had an account, running the schema upgrades it to admin.

Log in with that email and an **Admin** link appears in the menu (`/admin`). If you were already logged in, log out and back in.

To add another admin later, run in the Supabase SQL Editor:
```sql
insert into public.admin_emails (email) values ('another@example.com');
-- and if that person already has an account:
update public.profiles set role = 'admin'
where id = (select id from auth.users where lower(email) = lower('another@example.com'));
```

## Admin dashboard
| Tab | What it does |
|---|---|
| Add product | Picture + name + category + cost + quantity + bio → uploaded to Supabase and live immediately |
| Inventory | +/− or type a quantity, edit price/name/category/bio, change the picture, hide/show, delete |
| Orders | All paid orders with address; mark shipped / delivered |
| Gallery | Upload multiple photos with a caption, delete photos |
| Vlogs | Add a YouTube link with title and description, delete |
| Feedback | Remove inappropriate feedback |

## Payments
At checkout the customer picks **UPI QR**, **Credit card** or **Debit card**; Razorpay Checkout then shows only that method. The backend:
1. recalculates the total from database prices and checks stock (`/api/payments/create-order`),
2. verifies Razorpay's signature (`/api/payments/verify`),
3. marks the order paid and reduces stock in one database transaction. If an item sold out in the meantime, the order is marked failed and the payment is refunded automatically.

Test cards: https://razorpay.com/docs/payments/payments/test-card-details/

## Hosting

| Part | Platform |
|---|---|
| Frontend (`client/`) | Vercel |
| Backend (`server/`) | Render (`render.yaml` is included) |
| Database, auth, images | Supabase (already hosted) |

Push the project to a GitHub repository first. Both platforms deploy from GitHub and redeploy on every push.

### 1. Backend on Render
1. https://render.com → **New → Blueprint** → choose the repo. Render reads `render.yaml`.
2. Fill in the environment variables it asks for (same values as `server/.env`). For `CLIENT_URL`, enter a placeholder for now; you'll set it in step 3.
3. Deploy, then copy the URL (e.g. `https://pottedleaf-api.onrender.com`). Check `…/api/health` shows `{"ok":true}`.

The free plan sleeps after 15 minutes without visits, so the first request after that takes about a minute. The Starter plan ($7/month) stays awake, which is better for a live shop.

### 2. Frontend on Vercel
1. https://vercel.com → **Add New → Project** → import the repo.
2. **Root Directory:** `client`. Vercel detects Vite automatically.
3. Environment variables:
   - `VITE_API_URL` = your Render URL (no trailing slash)
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
4. Deploy. `client/vercel.json` makes page links like `/shop/pots` work on refresh.

### 3. Connect them
- On Render, set `CLIENT_URL` to your Vercel URL (e.g. `https://pottedleaf.vercel.app`; separate several with commas if you add a custom domain) and redeploy.
- In Supabase → **Authentication → URL Configuration**, set **Site URL** to your Vercel URL so signup confirmation emails link to the live site.
- Razorpay webhook (optional): `https://<render-url>/api/payments/webhook`.
- When you go live, swap the Razorpay test keys for live keys on Render (Razorpay needs your business KYC first).

### Custom domain
Buy a domain (e.g. from GoDaddy or Namecheap), add it in Vercel → Project → **Domains**, and add it to `CLIENT_URL` on Render.
