// Centralized API client for POTTERY RUGS & HOME DECOR

export const API_BASE = (
  import.meta.env.VITE_API_URL ||
  'https://pottery-rugs-api.onrender.com/api'
).replace(/\/$/, '');

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const token = typeof window !== 'undefined' ? localStorage.getItem('pottery_rugs_token') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers,
    credentials: 'include' // Strictly authenticates via secure httpOnly cookies
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new ApiError(
        data.message || `Request failed (${response.status})`,
        response.status,
        data
      );
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
  createOrder: (items, couponCode = null) =>
    request('/payments/create-order', { method: 'POST', body: JSON.stringify({ items, couponCode }) }),
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
  createProduct: (data) =>
    request('/admin/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) =>
    request(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) =>
    request(`/admin/products/${id}`, { method: 'DELETE' }),

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

