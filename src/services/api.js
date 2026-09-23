// Centralized API client for House of Loom & Craft

const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();
const configuredApiUrl = rawApiUrl.includes(',') ? rawApiUrl.split(',')[0].trim() : rawApiUrl;
const DEPLOYED_API = 'https://pottery-rugs-api.onrender.com/api';

export const API_BASE = (
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? 'http://localhost:5000/api'
    : (configuredApiUrl || DEPLOYED_API)
).replace(/\/$/, '');

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

// In-memory cache for fast, zero-delay subsequent reads (TTL: 90 seconds)
const apiCache = new Map();
const CACHE_TTL = 90 * 1000;

export const clearApiCache = (filterPattern = '') => {
  if (!filterPattern) {
    apiCache.clear();
  } else {
    for (const key of apiCache.keys()) {
      if (key.includes(filterPattern)) {
        apiCache.delete(key);
      }
    }
  }
};

export const prewarmBackend = () => {
  try {
    fetch(`${API_BASE}/health`, { method: 'GET', keepalive: true }).catch(() => {});
  } catch (_) {}
};

async function request(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  let url = `${API_BASE}${endpoint}`;
  const isGet = method === 'GET';

  // Check cache for GET requests (exclude admin and user auth endpoints)
  if (isGet && !endpoint.includes('/auth/') && !endpoint.includes('/admin/')) {
    const cached = apiCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('pottery_rugs_token') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const timeoutMs = options.timeout || (API_BASE.includes('localhost') ? 3500 : 12000);
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  const config = {
    ...options,
    headers,
    signal: options.signal || controller?.signal,
    credentials: 'include' // Strictly authenticates via secure httpOnly cookies
  };

  try {
    let response;
    try {
      response = await fetch(url, config);
    } catch (networkErr) {
      // If local dev server is unreachable, attempt fallback to deployed API
      if (API_BASE.includes('localhost') || API_BASE.includes('127.0.0.1')) {
        url = `${DEPLOYED_API}${endpoint}`;
        response = await fetch(url, config);
      } else {
        throw networkErr;
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new ApiError(
        data.message || `Request failed (${response.status})`,
        response.status,
        data
      );
    }

    if (isGet && !endpoint.includes('/auth/') && !endpoint.includes('/admin/')) {
      apiCache.set(url, { data, timestamp: Date.now() });
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || 'Unable to connect to server. Please verify your connection.', 0);
  }
}

// ==================== AUTHENTICATION ====================
export const authAPI = {
  register: async (payload) => {
    const data = await request('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
    if (data?.token && typeof window !== 'undefined') {
      localStorage.setItem('pottery_rugs_token', data.token);
    }
    return data;
  },
  login: async (payload) => {
    const data = await request('/auth/login', { method: 'POST', body: JSON.stringify(payload) });
    if (data?.token && typeof window !== 'undefined') {
      localStorage.setItem('pottery_rugs_token', data.token);
    }
    return data;
  },
  logout: async () => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pottery_rugs_token');
      }
    }
  },
  getMe: () => request('/auth/me'),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: async (payload) => {
    const data = await request('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) });
    if (data?.token && typeof window !== 'undefined') {
      localStorage.setItem('pottery_rugs_token', data.token);
    }
    return data;
  },
  changePassword: (payload) => request('/auth/change-password', { method: 'PUT', body: JSON.stringify(payload) })
};

// ==================== USER PROFILE & ADDRESSES ====================
export const usersAPI = {
  getProfile: () => request('/users/profile'),
  updateProfile: (payload) => request('/users/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  getAddresses: () => request('/users/addresses'),
  addAddress: (address) => request('/users/addresses', { method: 'POST', body: JSON.stringify(address) }),
  updateAddress: (id, address) => request('/users/addresses/' + id, { method: 'PUT', body: JSON.stringify(address) }),
  deleteAddress: (id) => request('/users/addresses/' + id, { method: 'DELETE' }),
  setDefaultAddress: (id) => request('/users/addresses/' + id + '/default', { method: 'PUT' })
};

// ==================== PRODUCTS & COLLECTIONS ====================
export const productsAPI = {
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/products${query ? `?${query}` : ''}`);
  },
  getProductBySlug: (slug) => request(`/products/${slug}`),
  getProductById: (id) => request(`/products/id/${id}`),
  searchProducts: (q) => request(`/products/search?q=${encodeURIComponent(q)}`),
  getCollections: () => request('/products/collections')
};

// ==================== CART (PERSISTENT & VALIDATED) ====================
export const cartAPI = {
  getCart: () => request('/cart'),
  addItem: (productId, quantity = 1, selectedVariant = '') =>
    request('/cart/items', { method: 'POST', body: JSON.stringify({ productId, quantity, selectedVariant }) }),
  updateItem: (productId, quantity) =>
    request(`/cart/items/${productId}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
  removeItem: (productId) =>
    request(`/cart/items/${productId}`, { method: 'DELETE' }),
  clearCart: () =>
    request('/cart', { method: 'DELETE' }),
  syncCart: (guestItems) =>
    request('/cart/sync', { method: 'POST', body: JSON.stringify({ guestItems }) })
};

// ==================== WISHLIST (PERSISTENT) ====================
export const wishlistAPI = {
  getWishlist: () => request('/wishlist'),
  addItem: (productId) =>
    request(`/wishlist/${productId}`, { method: 'POST' }),
  removeItem: (productId) =>
    request(`/wishlist/${productId}`, { method: 'DELETE' }),
  syncWishlist: (guestWishlist) =>
    request('/wishlist/sync', { method: 'POST', body: JSON.stringify({ guestWishlist }) })
};

// ==================== ORDERS & CHECKOUT ====================
export const ordersAPI = {
  createOrder: (orderPayload) =>
    request('/orders', { method: 'POST', body: JSON.stringify(orderPayload) }),
  getOrders: () =>
    request('/orders'),
  getOrderById: (orderId) =>
    request(`/orders/${orderId}`),
  cancelOrder: (orderId, reason = '') =>
    request(`/orders/${orderId}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) })
};

// ==================== PAYMENTS (RAZORPAY) ====================
export const paymentsAPI = {
  createOrder: (items, couponCode = null, currency = 'INR') =>
    request('/payments/create-order', { method: 'POST', body: JSON.stringify({ items, couponCode, currency }) }),
  verifyPayment: (payload) =>
    request('/payments/verify', { method: 'POST', body: JSON.stringify(payload) })
};

// ==================== OFFERS & COUPONS (CUSTOMER) ====================
export const offersAPI = {
  validateOffer: (code, subtotal, items = []) =>
    request('/offers/validate', { method: 'POST', body: JSON.stringify({ code, subtotal, items }) })
};

// ==================== ADMIN PANEL APIs ====================
export const adminAPI = {
  // Dashboard Metrics
  getDashboard: () => request('/admin/dashboard'),

  // Products
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/products${query ? `?${query}` : ''}`);
  },
  getProductById: (id) => request(`/admin/products/${id}`),
  createProduct: async (data) => {
    const res = await request('/admin/products', { method: 'POST', body: JSON.stringify(data) });
    clearApiCache();
    return res;
  },
  updateProduct: async (id, data) => {
    const res = await request(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    clearApiCache();
    return res;
  },
  deleteProduct: async (id) => {
    const res = await request(`/admin/products/${id}`, { method: 'DELETE' });
    clearApiCache();
    return res;
  },

  // Users
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/users${query ? `?${query}` : ''}`);
  },
  getUserById: (id) => request(`/admin/users/${id}`),
  deleteUser: (id) =>
    request(`/admin/users/${id}`, { method: 'DELETE' }),

  // Orders
  getOrders: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/orders${query ? `?${query}` : ''}`);
  },
  getOrderById: (id) => request(`/admin/orders/${id}`),
  updateOrderStatus: (id, orderStatus, note = '') =>
    request(`/admin/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ orderStatus, note }) }),
  updateOrderTracking: (id, trackingData) =>
    request(`/admin/orders/${id}/tracking`, { method: 'PUT', body: JSON.stringify(trackingData) }),

  // Offers & Coupons
  getOffers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/offers${query ? `?${query}` : ''}`);
  },
  getOfferById: (id) => request(`/admin/offers/${id}`),
  createOffer: (data) =>
    request('/admin/offers', { method: 'POST', body: JSON.stringify(data) }),
  updateOffer: (id, data) =>
    request(`/admin/offers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteOffer: (id) =>
    request(`/admin/offers/${id}`, { method: 'DELETE' })
};

// ==================== CONCIERGE CHATBOT ====================
export const chatAPI = {
  sendMessage: (message, history = [], currency = 'INR') =>
    request('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history, currency })
    })
};

// ==================== SUPPORT TICKETS ====================
export const supportAPI = {
  // Customer support methods
  getMyTickets: () => request('/support/tickets'),
  getTicketById: (id) => request(`/support/tickets/${id}`),
  createTicket: (payload) =>
    request('/support/tickets', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  addTicketMessage: (id, payload) =>
    request(`/support/tickets/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Admin support methods
  getTicketsAdmin: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/support/tickets${query ? `?${query}` : ''}`);
  },
  getTicketByIdAdmin: (id) => request(`/admin/support/tickets/${id}`),
  updateTicketStatusAdmin: (id, status) =>
    request(`/admin/support/tickets/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),
  replyTicketAdmin: (id, message, attachments = []) =>
    request(`/admin/support/tickets/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ message, attachments })
    }),
  addInternalNoteAdmin: (id, note) =>
    request(`/admin/support/tickets/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note })
    })
};

// ==================== CURRENCY & EXCHANGE RATES ====================
export const currencyAPI = {
  getRates: () => request('/currency/rates')
};





