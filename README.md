# POTTERY RUGS & HOME DECOR — Production-Ready Luxury Atelier Platform

> **Manufacturer & Exporter of Handcrafted Carpets and Architectural Home Accents**  
> G.T. Road, Ghosia, Aurai, Bhadohi 221301 U.P. (India)

---

## 1. Project Overview

**POTTERY RUGS & HOME DECOR** is a full-stack e-commerce web platform for a high-end luxury carpet manufacturer and exporter based in Bhadohi, Uttar Pradesh (India). 

The platform retains its core identity as an architectural, editorial showroom—featuring 3D WebGL carpet inspections, cinematic transition videos, deep craftsmanship storytelling, and a warm earthy palette (`#45563D` olive, `#FAF7F0` cream, `#D4BC9F` sand/camel, and `#362B21` deep brown)—while offering enterprise-grade e-commerce capabilities:
- User authentication via secure `httpOnly` cookies and JWT
- Private client profiles with multiple address management
- Authoritative database pricing & inventory with atomic race-condition safety
- Persistent shopping bag with guest-to-account synchronization
- Complete order lifecycle, status tracking timelines, and printable invoices
- Live Razorpay payment gateway integration with HMAC-SHA256 signature verification and API verification
- Full password reset flow with secure hashed tokens and email integration
- Comprehensive SEO structured data (Product, Organization, Breadcrumb JSON-LD, sitemap, robots.txt)
- Seamless Vercel SPA routing and Railway/Node backend architecture

---

## 2. Tech Stack

- **Frontend**: React 18, Vite 6, React Router DOM 7, Tailwind CSS, Framer Motion 12, Lucide Icons, Three.js, React Three Fiber & Drei, Canvas Confetti.
- **Backend**: Node.js (v18+), Express 4, Mongoose 8, Helmet, CORS, Cookie-Parser, Morgan, Express-Rate-Limit, Razorpay SDK, Bcryptjs, JsonWebToken.
- **Database**: MongoDB 8+ (MongoDB Atlas in production or local MongoDB service).
- **Payment Gateway**: Razorpay (Live webhook & HMAC-SHA256 verification).
- **Email Delivery**: Resend / SendGrid REST API integration.

---

## 3. Project Structure

```
pottery-rugs-luxury-decor/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # MongoDB connection & reconnect logic
│   │   ├── controllers/
│   │   │   ├── authController.js     # Register, login, logout, password reset flow
│   │   │   ├── userController.js     # Profile details & address management
│   │   │   ├── productController.js  # Catalog, collections & search
│   │   │   ├── cartController.js     # Persistent bag & guest sync
│   │   │   ├── wishlistController.js # Persistent wishlist
│   │   │   ├── orderController.js    # Authoritative calculation & idempotent cancellations
│   │   │   └── paymentController.js  # Live Razorpay verification & security guards
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT cookie/bearer protection & role guards
│   │   │   └── errorHandler.js       # Centralized sanitized error handler
│   │   ├── models/
│   │   │   ├── User.js               # Customer & admin schema with addresses
│   │   │   ├── Product.js            # Heirloom carpet & decor specifications
│   │   │   ├── Cart.js               # User-linked shopping bag
│   │   │   └── Order.js              # Immutable snapshot orders & history
│   │   ├── routes/                   # REST API routes
│   │   ├── scripts/
│   │   │   └── seed.js               # Non-destructive upsert database seeder
│   │   ├── services/
│   │   │   └── emailService.js       # Resend / SendGrid email delivery service
│   │   └── server.js                 # Express server with CORS & security headers
│   ├── .env.example
│   ├── .env
│   └── package.json
│
├── public/
│   ├── images/                       # High-res photography & logo
│   ├── textures/                     # Carpet pile & medallion textures
│   ├── videos/                       # Atelier showroom & cinematic videos
│   ├── robots.txt                    # Search crawler directives
│   └── sitemap.xml                   # Complete production XML sitemap
│
├── src/
│   ├── components/
│   │   ├── 3d/                       # Interactive Three.js carpet model
│   │   ├── common/                   # Navbar, MobileMenu, CustomCursor, Toast, SEO, ProtectedRoute
│   │   ├── drawers/                  # CartDrawer, WishlistDrawer, SearchModal, QuickViewModal, ConsultationModal
│   │   └── sections/                 # Hero, TransitionSection, FeaturedCarpets, Craftsmanship, BrandStory, etc.
│   ├── context/
│   │   ├── AuthContext.jsx           # Session management & user state
│   │   ├── CartContext.jsx           # Persistent bag & guest merge
│   │   └── WishlistContext.jsx       # Persistent saved curations
│   ├── data/
│   │   ├── carpets.js                # Initial carpet specs & dynamic collections
│   │   ├── decor.js                  # Initial home decor items
│   │   └── journal.js                # Editorial journal stories
│   ├── pages/                        # All application routes
│   ├── services/
│   │   └── api.js                    # Centralized API service layer
│   ├── App.jsx                       # Routing & root context tree
│   ├── index.css                     # Tailwind CSS & custom styling
│   └── main.jsx
│
├── vercel.json                       # Vercel SPA rewrite configuration
├── .env.example
├── index.html                        # Razorpay Checkout SDK & Google Fonts
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## 4. Environment Variables

### Backend (`backend/.env`)
```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
# Optional comma-separated list of additional trusted origins
ALLOWED_ORIGINS=

# MongoDB Database Connection (Atlas or local)
MONGODB_URI=mongodb://127.0.0.1:27017/pottery_rugs

# JWT Authentication
JWT_SECRET=pottery_rugs_luxury_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
# Local development offline simulation toggle. MUST be false in production!
RAZORPAY_SIMULATION=false

# Production Email Service (Password Recovery)
# Supported: resend | sendgrid
EMAIL_PROVIDER=resend
EMAIL_API_KEY=
EMAIL_FROM=House of Loom & Craft <Potteryrugs@gmail.com>

# Initial Seed Credentials
SEED_ADMIN_EMAIL=Potteryrugs@gmail.com
SEED_ADMIN_PASSWORD=AtelierMaster2026!
SEED_CLIENT_EMAIL=client@potteryrugs.com
SEED_CLIENT_PASSWORD=AtelierClient2026!
```

### Frontend (`.env`)
```env
# In production on Vercel, point VITE_API_URL to your deployed Railway/Render backend URL
VITE_API_URL=http://localhost:5000/api
VITE_SITE_URL=https://potteryrugs.com
VITE_WHATSAPP_NUMBER=919839116625

# Public Razorpay Key ID (Client-side safe; never expose secret key here)
VITE_RAZORPAY_KEY_ID=
```

---

## 5. Local Setup & Development

### Requirements
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later
- **MongoDB**: Local community server or MongoDB Atlas URI

### Step 1: Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..
```

### Step 2: Seed Database
Ensure MongoDB is running, then populate initial products and demo accounts:
```bash
npm run seed
```
*Synchronizes 16 handcrafted carpets and home decor masterworks into the database. (Demo account seeding is disabled by default via `SEED_DEMO_USERS=false` to protect production user accounts).*

### Step 3: Run Local Servers
**Terminal 1 — Backend API:**
```bash
npm run server
```
*Backend runs on `http://localhost:5000`.*

**Terminal 2 — Frontend App:**
```bash
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 6. Production Deployment

### Frontend (Vercel)
1. Import the repository into Vercel.
2. Root Directory: `./` (project root).
3. Framework Preset: **Vite**.
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. Configure Environment Variables in Vercel Project Settings:
   - `VITE_API_URL`: `https://your-backend.railway.app/api`
   - `VITE_SITE_URL`: `https://potteryrugs.com`
   - `VITE_WHATSAPP_NUMBER`: `919839116625`
   - `VITE_RAZORPAY_KEY_ID`: `rzp_live_...`
7. SPA routing is managed automatically by `vercel.json` (`rewrites: [ { "source": "/(.*)", "destination": "/index.html" } ]`).

### Backend (Railway / Render / Heroku)
1. Deploy from the `backend/` directory or root with root directory specified as `backend`.
2. Start Command: `node src/server.js`.
3. Configure Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5000` (or host provided `$PORT`)
   - `FRONTEND_URL`: `https://potteryrugs.com` (your production frontend domain)
   - `BACKEND_URL`: `https://your-backend.railway.app`
   - `MONGODB_URI`: `mongodb+srv://<username>:<password>@cluster0.slnhlei.mongodb.net/pottery_rugs?appName=Cluster0`
   - `JWT_SECRET`: A secure 64+ character random string
   - `JWT_EXPIRES_IN`: `7d`
   - `RAZORPAY_KEY_ID`: `rzp_live_...`
   - `RAZORPAY_KEY_SECRET`: `your_live_razorpay_secret`
   - `RAZORPAY_SIMULATION`: `false`
   - `EMAIL_PROVIDER`: `resend` (or `sendgrid`)
   - `EMAIL_API_KEY`: `re_...` (Resend API key)
   - `EMAIL_FROM`: `House of Loom & Craft <Potteryrugs@gmail.com>`
   - `SEED_DEMO_USERS`: `false`

---

## 7. Security Architecture

1. **Strict CORS Validation**: In production, the backend allows requests strictly from `FRONTEND_URL` and explicitly defined `ALLOWED_ORIGINS`. Localhost origins are only allowed in development mode.
2. **Authoritative Server Pricing**: Prices in request bodies are ignored. Order items and totals are computed strictly from MongoDB Product records. Negative and zero quantities are rejected.
3. **Atomic Stock Updates & Idempotency**:
   - Stock decrements use atomic MongoDB operations (`{ $inc: { stock: -qty } }`).
   - Customer cancellations and curator cancellations restore inventory stock **exactly once**. Duplicate cancellation requests cannot double-restore inventory.
4. **Live Razorpay Verification**:
   - Signature verified via HMAC-SHA256 using server-only `RAZORPAY_KEY_SECRET`.
   - Verified against Razorpay REST API for currency (`INR`), amount match, order ID match, and `captured`/`authorized` status.
   - Simulation is strictly forbidden in production. Missing credentials return a 503 error rather than pretending payment succeeded.
5. **Secure Password Reset**:
   - Uses cryptographically secure random 32-byte tokens.
   - Token stored as SHA-256 hash with 30-minute expiry.
   - Token is delivered via production email (Resend/SendGrid) and never returned in production API responses.
   - On password reset, the token is permanently invalidated and the new password hashed with bcrypt.
6. **Error Sanitization**:
   - 500 internal server errors in production return sanitized messages and do not leak stack traces or MongoDB details.

---

## 8. Client Handover Safety Checklist

Before handing over this project to the client:
- [x] Ensure `.env` and `backend/.env` are listed in `.gitignore` and not tracked in Git.
- [x] Provide `.env.example` and `backend/.env.example` containing placeholders only.
- [x] Ensure no live API keys, secrets, or passwords are baked into source code or Git history.
- [x] Rotate any credentials that were previously used in development or shared environments.
