# thePottedLeaf — Product Requirements

An online store for plants, pots and gardening tools. Multi-page web app with customer accounts, an admin back-office, Supabase as database/auth/storage, and Razorpay for payments.

> Reference site for the business domain: https://www.urvann.com/ — thePottedLeaf uses its own design and is **not** a copy.

---

## 1. Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + TypeScript, Vite, React Router (multi-page routing) |
| Backend | Node.js + **TypeScript**, Express |
| Database | Supabase Postgres (with Row Level Security) |
| Auth | Supabase Auth: **Continue with Google** + email/password |
| File storage | Supabase Storage (`product-images`, `gallery` buckets) |
| Payments | Razorpay (UPI QR, Credit Card, Debit Card) |

The frontend uses Supabase **only for login/signup**. All data reads and writes go through the TypeScript backend, which talks to Supabase with the service-role key and checks the user's role.

---

## 2. User roles

| Role | Can do |
|---|---|
| **Guest** (not logged in) | Browse every page, view products, add to cart, read vlogs, feedback and gallery |
| **Customer** (logged in) | Everything a guest can + checkout & pay, see own orders, post feedback |
| **Admin** | Everything + admin dashboard: add/edit/remove products, change stock quantity, upload gallery photos, add vlogs, delete feedback, view all orders |

- An admin is a normal Supabase user whose `profiles.role = 'admin'`.
- **Admin account: thepottedleafs@gmail.com.** It is listed in the `admin_emails` table, so it gets the admin role automatically when it signs up (or straight away if the account already exists when the schema is run).
- Login is **optional for browsing** and **mandatory for checkout**. Going to `/checkout` while logged out redirects to `/login` and returns to checkout after login.

---

## 3. Pages (multi-page site)

| Route | Page | Access |
|---|---|---|
| `/` | Home — hero, shop-by-category tiles, featured products, latest feedback | Public |
| `/shop` | All products, with category filter, search and sort | Public |
| `/shop/:category` | Products of one category | Public |
| `/product/:id` | Product details — image, price, stock, bio, add to cart | Public |
| `/cart` | Cart — change quantity, remove, subtotal | Public |
| `/checkout` | Shipping address + payment method selection + pay | **Login required** |
| `/order-success/:id` | Payment confirmation | Login required |
| `/orders` | My orders | Login required |
| `/vlogs` | Vlogs — video posts (YouTube) with title and description | Public |
| `/feedback` | Customer feedback wall + form to submit feedback (rating 1–5 + message) | View public, submit requires login |
| `/gallery` | Photo gallery uploaded by admin | Public |
| `/about` | About the business & contact info (see 3.1; also shown in the footer) | Public |
| `/contact` | Contact us | Public |
| `/terms`, `/privacy`, `/refund-policy`, `/shipping-policy` | Policy pages (required for Razorpay website verification), linked in the footer | Public |
| `/login`, `/signup` | Auth | Public |
| `/admin` | Admin dashboard (tabs below) | **Admin only** |

### 3.1 Business & contact details
Shown on the About page and in the site footer (edit in `client/src/lib/contact.ts`):

| | |
|---|---|
| Business | VM Botanicals (C/O Shalini Gupta) |
| GSTIN | 09BAUPG4039G2ZE |
| Address | 9/10 White Colony, Dada Nagar, Kanpur, Uttar Pradesh 208022, India |
| Phone | +91 98895 06070 · +91 87954 64248 |
| Email | thepottedleafs@gmail.com |

### 3.2 Product categories (sections)

Products are listed section-wise:

1. Tools
2. Fruit Plants
3. Vegetable Plants
4. Flower Plants
5. Showcase Plants
6. Office Plants
7. Pots & Planters
8. Seeds

How categories work:
- When the admin adds an item, they **must pick its category** from a dropdown. It is saved in the `products.category` column (indexed, and limited to the valid values by a CHECK constraint), so items are easy to add and filter in Supabase.
- `/shop` lists all products **section by section**, one heading per category, with a "See all" link to that category.
- `/shop/:category` shows only that category; the backend filters with `WHERE category = …`.
- Categories are defined in `supabase/schema.sql`, `server/src/lib/categories.ts` and `client/src/lib/categories.ts`. To add one, add it in all three places.

---

## 4. Admin dashboard (`/admin`)

### 4.1 Add product (the main admin page)
A single simple form:
- **Picture** (image upload, JPG/PNG/WebP, max 5 MB)
- **Name**
- **Category** (dropdown)
- **Cost** (₹)
- **Quantity** (stock)
- **Bio** (description)

On submit: the image is uploaded to Supabase Storage, a row is inserted in `products`, and the item immediately appears on the website.

### 4.2 Manage inventory
- Table of all products with image, name, category, price, stock.
- **+ / −** buttons and a direct number field to change quantity; saves to Supabase.
- Edit price, hide/unhide, delete product.
- Products with quantity 0 show "Out of stock" on the website and cannot be added to cart.

### 4.3 Gallery
- Upload one or many photos with an optional caption → stored in `gallery` bucket + `gallery_images` table.
- Delete photos.

### 4.4 Vlogs
- Add vlog: title, YouTube URL, description. Delete vlog.

### 4.5 Feedback
- See all feedback, delete inappropriate entries.

### 4.6 Orders
- See all orders with customer, items, amount, payment status, shipping address.
- Update order status: `paid → shipped → delivered`.

---

## 5. Payments (Razorpay)

Checkout page shows three payment options:
1. **UPI QR code**
2. **Credit card**
3. **Debit card**

Flow:
1. Frontend sends cart (product IDs + quantities) and shipping address to `POST /api/payments/create-order`.
2. Backend re-reads prices & stock from the DB (never trusts client prices), creates a Razorpay order and stores a `pending` order in Supabase.
3. Frontend opens Razorpay Checkout, showing only the method the user selected (QR / credit / debit).
4. On success, frontend sends `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature` to `POST /api/payments/verify`.
5. Backend verifies the HMAC-SHA256 signature with the Razorpay key secret, marks the order `paid`, and **decrements stock atomically** (Postgres function).
6. Optional: `POST /api/payments/webhook` handles `payment.captured` as a backup (verified with webhook secret).

Use Razorpay **test keys** during development.

---

## 6. Data model (Supabase)

| Table | Key columns |
|---|---|
| `profiles` | `id` (= auth user id), `full_name`, `phone`, `role` (`customer`/`admin`) |
| `products` | `id`, `name`, `category`, `price`, `quantity`, `bio`, `image_url`, `is_active`, `created_at` |
| `orders` | `id`, `user_id`, `items` (jsonb snapshot), `amount`, `status` (`pending`/`paid`/`shipped`/`delivered`/`failed`), `razorpay_order_id`, `razorpay_payment_id`, `shipping_address` (jsonb), `created_at` |
| `feedback` | `id`, `user_id`, `name`, `rating` (1–5), `message`, `created_at` |
| `gallery_images` | `id`, `image_url`, `caption`, `created_at` |
| `vlogs` | `id`, `title`, `video_url`, `description`, `created_at` |

Storage buckets (public read): `product-images`, `gallery`.

Full SQL, RLS policies and the stock-decrement function: `supabase/schema.sql`.

---

## 7. Backend API (TypeScript / Express)

Auth: frontend sends `Authorization: Bearer <supabase access token>`; backend validates it with Supabase and loads the role.

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/products?category=&q=&sort=&limit=` | Public |
| GET | `/api/products/:id` | Public |
| GET | `/api/admin/products` (includes hidden) | Admin |
| POST | `/api/admin/products` (multipart: image, name, category, price, quantity, bio) | Admin |
| PATCH | `/api/admin/products/:id` (quantity, price, category, name, bio, is_active) | Admin |
| PUT | `/api/admin/products/:id/image` (multipart: image) | Admin |
| DELETE | `/api/admin/products/:id` | Admin |
| GET | `/api/gallery` | Public |
| POST | `/api/admin/gallery` (multipart, multiple images) | Admin |
| DELETE | `/api/admin/gallery/:id` | Admin |
| GET | `/api/vlogs` | Public |
| POST / DELETE | `/api/admin/vlogs[/:id]` | Admin |
| GET | `/api/feedback` | Public |
| POST | `/api/feedback` | Customer |
| DELETE | `/api/admin/feedback/:id` | Admin |
| GET | `/api/orders/mine` | Customer |
| GET | `/api/orders/:id` (own order only) | Customer |
| GET | `/api/admin/orders` | Admin |
| PATCH | `/api/admin/orders/:id` (status) | Admin |
| GET | `/api/me` | Customer (returns profile + role) |
| POST | `/api/payments/create-order` | Customer |
| POST | `/api/payments/verify` | Customer |
| POST | `/api/payments/webhook` | Razorpay |

---

## 8. Non-functional requirements

- **Responsive**: works on mobile (≥ 360 px), tablet and desktop.
- **Security**: service-role key and Razorpay secret live only in `server/.env`; prices computed server-side; payment signature verified server-side; admin endpoints check role on the server; RLS enabled on all tables.
- **Performance**: images served from Supabase CDN; lazy-loaded images.
- **Design**: own visual identity — warm cream background, deep forest green, terracotta accent, serif headings (Fraunces) with Inter body text.

---

## 9. Environment variables

`server/.env`
```
PORT=4000
CLIENT_URL=http://localhost:5173
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

`client/.env`
```
VITE_API_URL=http://localhost:4000
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```
(The Razorpay key ID is sent to the browser by the backend with each order, so the frontend doesn't need it.)

---

## 10. Out of scope (possible later phases)
- Coupons / discounts, shipping-fee rules by pincode
- Cash on delivery
- Order emails / SMS
- Product reviews per product, wishlist
- Multiple images per product
