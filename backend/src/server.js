import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import wishlistRoutes from './routes/wishlist.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';
import offerRoutes from './routes/offers.js';
import chatRoutes from './routes/chat.js';
import supportRoutes from './routes/support.js';
import currencyRoutes from './routes/currency.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (supports execution from both root and backend directory)
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Fail-fast environment validation
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required');
}

if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.includes('change_in_production')) {
  throw new Error('Production environment cannot start with default placeholder JWT_SECRET. Set a unique cryptographically secure secret.');
}

// Initialize express
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false
}));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// CORS setup
const isProduction = process.env.NODE_ENV === 'production';

// Helper to normalize origin string (remove trailing slash and whitespace)
const normalizeOrigin = (url) => {
  if (!url || typeof url !== 'string') return '';
  return url.trim().replace(/\/+$/, '');
};

// Parse configured origins from environment variables (comma, semicolon, or whitespace separated)
const parseOrigins = (val) => {
  if (!val) return [];
  return val
    .split(/[,;\s]+/)
    .map(normalizeOrigin)
    .filter(Boolean);
};

const configuredOrigins = [
  ...parseOrigins(process.env.FRONTEND_URL),
  ...parseOrigins(process.env.ALLOWED_ORIGINS)
];

// Development local origins
const devLocalOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
];

// Production origins: strictly include both apex and www domains for House of Loom & Craft
const defaultProductionOrigins = [
  'https://www.houseofloomcraft.com',
  'https://houseofloomcraft.com',
  'https://www.houseofloomandcraft.com',
  'https://houseofloomandcraft.com',
  'https://house-of-loom-craft.vercel.app'
];

const allowedOrigins = Array.from(new Set([
  ...defaultProductionOrigins,
  ...configuredOrigins,
  ...devLocalOrigins
])).map(normalizeOrigin).filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow non-browser requests with no origin (e.g. server health checks, curl, webhooks, mobile clients)
    if (!origin) {
      return callback(null, true);
    }

    const cleanOrigin = normalizeOrigin(origin);

    const isExplicitlyAllowed = allowedOrigins.includes(cleanOrigin);
    const isVercelPreview = cleanOrigin.endsWith('.vercel.app');
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin);

    if (isExplicitlyAllowed || isVercelPreview || isLocalhost) {
      // Reflect exact requesting origin to support credentials (wildcards disallowed with credentials)
      return callback(null, cleanOrigin);
    }

    // Do NOT pass an Error to callback in production!
    // Passing callback(new Error(...)) causes Express to trigger 500 error on preflight.
    // Returning callback(null, false) safely rejects CORS without crashing or returning 500.
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'x-razorpay-signature',
    'x-currency',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 204,
  maxAge: 86400
};

// Apply CORS middleware and handle preflight OPTIONS requests early before any body parsing or rate limiting
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body & cookie parsers (retains exact rawBody Buffer for cryptographic webhook signature verification)
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate Limiting (Skip preflight OPTIONS requests so they are never throttled or blocked)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  message: {
    success: false,
    message: 'Too many requests from this client. Please try again in 15 minutes.'
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  message: {
    success: false,
    message: 'Too many authentication attempts. Please wait 15 minutes before trying again.'
  }
});

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/payments/create-order', authLimiter);
app.use('/api/payments/verify', authLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    brand: 'House of Loom & Craft',
    atelier: 'Bhadohi, U.P. (India)',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
// Ensure admin endpoints are never cached by browsers or intermediate CDNs
app.use('/api/admin', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});
app.use('/api/admin', adminRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/currency', currencyRoutes);

// 404 handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Atelier endpoint '${req.originalUrl}' not found.`
  });
});

// Centralized error handler
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`[Atelier Server] House of Loom & Craft API running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});

export default app;
