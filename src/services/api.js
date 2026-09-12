// Centralized API client for POTTERY RUGS & HOME DECOR

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === 'production'
    ? 'https://pottery-rugs-api.onrender.com/api'
    : '/api')
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
        data.message || `Atelier request failed (${response.status})`,
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || 'Unable to connect to the atelier service. Please verify your connection.', 0);
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
  createOrder: (items) =>
    request('/payments/create-order', { method: 'POST', body: JSON.stringify({ items }) }),
  verifyPayment: (payload) =>
    request('/payments/verify', { method: 'POST', body: JSON.stringify(payload) })
};
