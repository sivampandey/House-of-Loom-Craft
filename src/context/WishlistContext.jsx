import React, { createContext, useContext, useState, useEffect } from 'react';
import { wishlistAPI } from '../services/api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeWishlist = async () => {
      setLoading(true);
      try {
        if (isAuthenticated && user) {
          const savedGuest = localStorage.getItem('pottery_guest_wishlist');
          let guestItems = [];
          if (savedGuest) {
            try {
              guestItems = JSON.parse(savedGuest);
            } catch (e) {}
          }

          if (guestItems.length > 0) {
            const syncRes = await wishlistAPI.syncWishlist(guestItems);
            localStorage.removeItem('pottery_guest_wishlist');
            if (syncRes.success && syncRes.wishlist) {
              setWishlistItems(syncRes.wishlist);
              setLoading(false);
              return;
            }
          }

          const res = await wishlistAPI.getWishlist();
          if (res.success && res.wishlist) {
            setWishlistItems(res.wishlist);
          }
        } else {
          // Guest mode
          const local = localStorage.getItem('pottery_guest_wishlist');
          if (local) {
            try {
              setWishlistItems(JSON.parse(local));
            } catch (e) {
              setWishlistItems([]);
            }
          } else {
            setWishlistItems([]);
          }
        }
      } catch (err) {
        console.error('Wishlist initialization error', err);
      } finally {
        setLoading(false);
      }
    };

    initializeWishlist();
  }, [isAuthenticated, user?._id]);

  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem('pottery_guest_wishlist', JSON.stringify(wishlistItems));
    }
  }, [wishlistItems, isAuthenticated]);

  const isWishlisted = (idOrSlug) => {
    return wishlistItems.some(
      item => item._id === idOrSlug || item.slug === idOrSlug || item.id === idOrSlug
    );
  };

  const toggleWishlist = async (product) => {
    const targetId = product.slug || product._id || product.id;
    const exists = isWishlisted(targetId);

    if (isAuthenticated) {
      try {
        if (exists) {
          const res = await wishlistAPI.removeItem(targetId);
          if (res.success && res.wishlist) {
            setWishlistItems(res.wishlist);
          }
          return { saved: false, message: `${product.name} removed from your saved pieces.` };
        } else {
          const res = await wishlistAPI.addItem(targetId);
          if (res.success && res.wishlist) {
            setWishlistItems(res.wishlist);
          }
          return { saved: true, message: `${product.name} saved to your private curation.` };
        }
      } catch (err) {
        console.error('Wishlist API error', err);
        throw err;
      }
    } else {
      // Guest mode
      if (exists) {
        setWishlistItems(prev =>
          prev.filter(
            i => i._id !== targetId && i.slug !== targetId && i.id !== targetId
          )
        );
        return { saved: false, message: `${product.name} removed from your saved pieces.` };
      } else {
        setWishlistItems(prev => [
          ...prev,
          {
            ...product,
            id: targetId,
            slug: product.slug || targetId,
            _id: product._id || null
          }
        ]);
        return { saved: true, message: `${product.name} saved to your private curation.` };
      }
    }
  };

  const removeFromWishlist = async (idOrSlug) => {
    if (isAuthenticated) {
      try {
        const res = await wishlistAPI.removeItem(idOrSlug);
        if (res.success && res.wishlist) {
          setWishlistItems(res.wishlist);
        }
      } catch (e) {
        console.error('Error removing from wishlist', e);
      }
    } else {
      setWishlistItems(prev =>
        prev.filter(
          i => i._id !== idOrSlug && i.slug !== idOrSlug && i.id !== idOrSlug
        )
      );
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        isWishlistOpen,
        setIsWishlistOpen,
        loading,
        isWishlisted,
        toggleWishlist,
        removeFromWishlist
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
