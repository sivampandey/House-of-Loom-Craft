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

// Parse configured origins from environment
const configuredOrigins = [];
if (process.env.FRONTEND_URL) {
  configuredOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, ''));
}
if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS.split(',').forEach(o => {
    const trimmed = o.trim().replace(/\/$/, '');
    if (trimmed && !configuredOrigins.includes(trimmed)) {
      configuredOrigins.push(trimmed);
    }
  });
}

// Development local origins (strictly permitted ONLY in development mode)
const devLocalOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
];

const defaultProductionOrigins = [
  'https://pottery-rugs.vercel.app',
  'https://potteryrugs.com',
  'https://www.potteryrugs.com'
];

const allowedOrigins = isProduction
  ? Array.from(new Set([...defaultProductionOrigins, ...configuredOrigins]))
  : Array.from(new Set([...configuredOrigins, ...devLocalOrigins, ...defaultProductionOrigins]));

app.use(cors({
  origin: function (origin, callback) {
    // Allow non-browser requests with no origin (e.g. server health checks, curl)
    if (!origin) {
      return callback(null, true);
    }

    const cleanOrigin = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(cleanOrigin) || cleanOrigin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    if (isProduction) {
      return callback(new Error(`CORS blocked for untrusted origin: ${origin}`));
    } else {
      // In development, allow localhost or 127.0.0.1
      if (cleanOrigin.includes('localhost') || cleanOrigin.includes('127.0.0.1')) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Body & cookie parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
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
  message: {
    success: false,
    message: 'Too many authentication attempts. Please wait 15 minutes before trying again.'
  }
});

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/payments/', authLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    brand: 'POTTERY RUGS & HOME DECOR',
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
app.use('/api/admin', adminRoutes);
app.use('/api/offers', offerRoutes);

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
  console.log(`[Atelier Server] Pottery Rugs API running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});

export default app;
