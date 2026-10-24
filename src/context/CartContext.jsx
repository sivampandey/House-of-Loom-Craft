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
          const savedGuestCart = localStorage.getItem('house_of_loom_guest_cart') || localStorage.getItem('pottery_guest_cart');
          let guestItems = [];
          if (savedGuestCart) {
            try {
              guestItems = JSON.parse(savedGuestCart);
            } catch (e) {}
          }

          if (guestItems.length > 0) {
            // Merge guest cart into DB
            const syncRes = await cartAPI.syncCart(guestItems);
            localStorage.removeItem('house_of_loom_guest_cart');
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
          const local = localStorage.getItem('house_of_loom_guest_cart') || localStorage.getItem('pottery_guest_cart');
          if (local) {
            try {
              setCartItems(JSON.parse(local));
            } catch (e) {
              setCartItems([]);
            }
          } else {
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
      localStorage.setItem('house_of_loom_guest_cart', JSON.stringify(cartItems));
    }
  }, [cartItems, isAuthenticated]);

  const getItemIdentifier = (item) => {
    if (!item) return '';
    return item.cartItemId || `${item.productId || item.slug || item.id || item._id}_${item.variantId || 'base'}`;
  };

  const addToCart = async (product, quantity = 1, selectedVariant = '', variantId = '', variantPrice = null, variantSize = '') => {
    const targetVariantId = variantId || product.variantId || '';
    const targetSize = variantSize || selectedVariant || product.selectedVariant || product.size || '';
    const pId = product.slug || product.id || product._id;
    const prodIdForApi = product._id || product.slug || product.id;
    const itemKey = `${prodIdForApi}_${targetVariantId || 'base'}`;

    if (isAuthenticated) {
      try {
        const res = await cartAPI.addItem(prodIdForApi, quantity, targetSize, targetVariantId, targetSize);
        if (res.success && res.cart) {
          setCartItems(res.cart.items || []);
        }
      } catch (err) {
        throw err;
      }
    } else {
      // Guest cart: distinct item per product + variant
      setCartItems(prev => {
        const existingIndex = prev.findIndex(i => {
          const isSameProd = (i.slug || i.id || i._id || i.productId) === pId;
          const isSameVar = (i.variantId || '') === (targetVariantId || '') &&
                            (i.size || i.selectedVariant || '') === (targetSize || '');
          return isSameProd && isSameVar;
        });

        if (existingIndex > -1) {
          return prev.map((item, idx) =>
            idx === existingIndex
              ? { ...item, quantity: (item.quantity || 1) + Number(quantity) }
              : item
          );
        }

        const effectivePrice = (variantPrice !== null && variantPrice !== undefined)
          ? Number(variantPrice)
          : (Number(product.price) || 0);

        return [
          ...prev,
          {
            ...product,
            id: pId,
            slug: product.slug || pId,
            productId: product._id || null,
            quantity: Number(quantity),
            variantId: targetVariantId,
            size: targetSize,
            selectedVariant: targetSize,
            cartItemId: itemKey,
            price: effectivePrice,
            dimensions: targetSize || product.dimensions || ''
          }
        ];
      });
    }
  };

  const updateQuantity = async (targetId, newQuantity, variantId = '') => {
    if (newQuantity < 1) return;

    // Resolve target cart item
    const targetItem = cartItems.find(i => 
      i._id === targetId || 
      i.cartItemId === targetId || 
      ( (i.productId === targetId || i.slug === targetId || i.id === targetId) && (!variantId || i.variantId === variantId) )
    );

    const productId = targetItem?.productId || targetItem?._id || targetId;
    const vId = variantId || targetItem?.variantId || '';
    const size = targetItem?.size || targetItem?.selectedVariant || '';
    const itemId = targetItem?._id || '';

    if (isAuthenticated) {
      try {
        const res = await cartAPI.updateItem(productId, newQuantity, vId, size, itemId);
        if (res.success && res.cart) {
          setCartItems(res.cart.items || []);
        }
      } catch (err) {
        console.error('Failed to update quantity on server', err);
      }
    } else {
      setCartItems(prev =>
        prev.map(item => {
          const matches = item._id === targetId ||
                          item.cartItemId === targetId ||
                          ( (item.productId === targetId || item.slug === targetId || item.id === targetId) && (!vId || item.variantId === vId) );
          return matches ? { ...item, quantity: newQuantity } : item;
        })
      );
    }
  };

  const removeFromCart = async (targetId, variantId = '') => {
    const targetItem = cartItems.find(i => 
      i._id === targetId || 
      i.cartItemId === targetId || 
      ( (i.productId === targetId || i.slug === targetId || i.id === targetId) && (!variantId || i.variantId === variantId) )
    );

    const productId = targetItem?.productId || targetItem?._id || targetId;
    const vId = variantId || targetItem?.variantId || '';
    const itemId = targetItem?._id || '';

    if (isAuthenticated) {
      try {
        const res = await cartAPI.removeItem(productId, vId, itemId);
        if (res.success && res.cart) {
          setCartItems(res.cart.items || []);
        }
      } catch (err) {
        console.error('Failed to remove cart item on server', err);
      }
    } else {
      setCartItems(prev =>
        prev.filter(item => {
          const matches = item._id === targetId ||
                          item.cartItemId === targetId ||
                          ( (item.productId === targetId || item.slug === targetId || item.id === targetId) && (!vId || item.variantId === vId) );
          return !matches;
        })
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
    localStorage.removeItem('house_of_loom_guest_cart');
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
