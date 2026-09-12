import React, { createContext, useContext, useState, useEffect } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load cart on auth change
  useEffect(() => {
    const initializeCart = async () => {
      setLoading(true);
      try {
        if (isAuthenticated && user) {
          // Check for any guest items in localStorage to merge
          const savedGuestCart = localStorage.getItem('pottery_guest_cart');
          let guestItems = [];
          if (savedGuestCart) {
            try {
              guestItems = JSON.parse(savedGuestCart);
            } catch (e) {}
          }

          if (guestItems.length > 0) {
            // Merge guest cart into DB
            const syncRes = await cartAPI.syncCart(guestItems);
            localStorage.removeItem('pottery_guest_cart');
            if (syncRes.success && syncRes.cart) {
              setCartItems(syncRes.cart.items || []);
              setLoading(false);
              return;
            }
          }

          // Fetch user cart from DB
          const res = await cartAPI.getCart();
          if (res.success && res.cart) {
            setCartItems(res.cart.items || []);
          }
        } else {
          // Guest mode: load from localStorage
          const local = localStorage.getItem('pottery_guest_cart');
          if (local) {
            try {
              setCartItems(JSON.parse(local));
            } catch (e) {
              setCartItems([]);
            }
          } else {
            // Default initial piece for immediate delight
            setCartItems([]);
          }
        }
      } catch (err) {
        console.error('Cart initialization error', err);
      } finally {
        setLoading(false);
      }
    };

    initializeCart();
  }, [isAuthenticated, user?._id]);

  // Save to localStorage when in guest mode
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem('pottery_guest_cart', JSON.stringify(cartItems));
    }
  }, [cartItems, isAuthenticated]);

  const addToCart = async (product, quantity = 1, selectedVariant = '') => {
    if (isAuthenticated) {
      try {
        const res = await cartAPI.addItem(product._id || product.slug || product.id, quantity, selectedVariant);
        if (res.success && res.cart) {
          setCartItems(res.cart.items);
        }
      } catch (err) {
        throw err;
      }
    } else {
      // Guest cart
      setCartItems(prev => {
        const pId = product.slug || product.id || product._id;
        const existing = prev.find(i => (i.slug || i.id || i._id) === pId);
        if (existing) {
          return prev.map(i =>
            (i.slug || i.id || i._id) === pId
              ? { ...i, quantity: (i.quantity || 1) + Number(quantity) }
              : i
          );
        }
        return [
          ...prev,
          {
            ...product,
            id: pId,
            slug: product.slug || pId,
            productId: product._id || null,
            quantity: Number(quantity),
            selectedVariant
          }
        ];
      });
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;

    if (isAuthenticated) {
      try {
        const res = await cartAPI.updateItem(productId, newQuantity);
        if (res.success && res.cart) {
          setCartItems(res.cart.items);
        }
      } catch (err) {
        console.error('Failed to update quantity on server', err);
      }
    } else {
      setCartItems(prev =>
        prev.map(item =>
          (item.productId === productId || item.slug === productId || item.id === productId || item._id === productId)
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  const removeFromCart = async (productId) => {
    if (isAuthenticated) {
      try {
        const res = await cartAPI.removeItem(productId);
        if (res.success && res.cart) {
          setCartItems(res.cart.items);
        }
      } catch (err) {
        console.error('Failed to remove cart item on server', err);
      }
    } else {
      setCartItems(prev =>
        prev.filter(
          item =>
            item.productId !== productId &&
            item.slug !== productId &&
            item.id !== productId &&
            item._id !== productId
        )
      );
    }
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        await cartAPI.clearCart();
      } catch (e) {}
    }
    setCartItems([]);
    localStorage.removeItem('pottery_guest_cart');
  };

  const subtotal = cartItems.reduce(
    (acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );

  const totalCount = cartItems.reduce(
    (acc, item) => acc + (Number(item.quantity) || 1),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        setIsCartOpen,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        subtotal,
        totalCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
