import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';

// Helper to format cart with authoritative product data and server-calculated totals
export const buildAuthoritativeCart = async (cartDoc) => {
  if (!cartDoc || !cartDoc.items.length) {
    return {
      items: [],
      subtotal: 0,
      totalCount: 0,
      priceChangesDetected: false,
      outOfStockItemsRemoved: false
    };
  }

  const populatedItems = [];
  let subtotal = 0;
  let totalCount = 0;
  let priceChangesDetected = false;
  let outOfStockItemsRemoved = false;

  // Batch query all products to avoid N+1 DB roundtrips
  const productIds = cartDoc.items.map(item => item.product).filter(Boolean);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map(p => [p._id.toString(), p]));

  for (const item of cartDoc.items) {
    const product = productMap.get(item.product?.toString());
    if (!product || !product.isActive || product.stock <= 0) {
      outOfStockItemsRemoved = true;
      continue;
    }

    let unitPrice = product.price;
    let comparePrice = product.compareAtPrice;
    let availableStock = product.stock;
    let variantSize = item.size || item.selectedVariant || product.dimensions || '';
    let variantId = item.variantId || '';

    // If product has size-wise variants, resolve the authoritative variant
    if (product.hasVariants && Array.isArray(product.variants) && product.variants.length > 0) {
      let matchedVariant = null;
      if (item.variantId) {
        matchedVariant = product.variants.find(v => v.id === item.variantId);
      }
      if (!matchedVariant && (item.selectedVariant || item.size)) {
        const querySize = (item.selectedVariant || item.size).trim().toLowerCase();
        matchedVariant = product.variants.find(v => (v.size || '').trim().toLowerCase() === querySize);
      }
      if (!matchedVariant) {
        matchedVariant = product.variants.find(v => v.isDefault && v.active !== false) ||
                         product.variants.find(v => v.active !== false);
      }

      if (matchedVariant) {
        if (matchedVariant.active === false) {
          outOfStockItemsRemoved = true;
          continue; // Inactive variant cannot be placed in bag
        }
        unitPrice = matchedVariant.price;
        comparePrice = matchedVariant.compareAtPrice ?? null;
        if (typeof matchedVariant.stock === 'number') {
          availableStock = matchedVariant.stock;
        }
        variantSize = matchedVariant.size;
        variantId = matchedVariant.id;
      }
    }

    if (availableStock <= 0) {
      outOfStockItemsRemoved = true;
      continue;
    }

    // Ensure requested quantity does not exceed available stock
    const validQty = Math.min(item.quantity, availableStock);
    const itemSubtotal = unitPrice * validQty;

    subtotal += itemSubtotal;
    totalCount += validQty;

    populatedItems.push({
      _id: item._id,
      cartItemId: `${product._id}_${variantId || 'base'}`,
      productId: product._id,
      id: product.slug, // For frontend compatibility
      slug: product.slug,
      name: product.name,
      price: unitPrice,
      compareAtPrice: comparePrice,
      image: product.thumbnail || (product.images && product.images[0]) || product.texture,
      texture: product.texture,
      dimensions: variantSize || product.dimensions,
      material: product.material,
      collection: product.collection,
      collectionName: product.collectionName,
      stock: availableStock,
      quantity: validQty,
      variantId,
      size: variantSize,
      selectedVariant: variantSize
    });
  }

  return {
    items: populatedItems,
    subtotal,
    totalCount,
    priceChangesDetected,
    outOfStockItemsRemoved
  };
};

export const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [] });
    }

    const calculatedCart = await buildAuthoritativeCart(cart);

    res.status(200).json({
      success: true,
      cart: calculatedCart
    });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1, selectedVariant = '', variantId = '', size = '' } = req.body;

    const product = await Product.findOne({
      $or: [{ _id: productId && productId.match(/^[0-9a-fA-F]{24}$/) ? productId : null }, { slug: productId }],
      isActive: true
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product is unavailable or does not exist.'
      });
    }

    let targetVariantId = variantId || '';
    let targetSize = size || selectedVariant || '';
    let availableStock = product.stock;

    if (product.hasVariants && Array.isArray(product.variants) && product.variants.length > 0) {
      let matched = null;
      if (targetVariantId) {
        matched = product.variants.find(v => v.id === targetVariantId);
      }
      if (!matched && targetSize) {
        matched = product.variants.find(v => (v.size || '').trim().toLowerCase() === targetSize.trim().toLowerCase());
      }
      if (!matched) {
        matched = product.variants.find(v => v.isDefault && v.active !== false) || product.variants.find(v => v.active !== false);
      }

      if (!matched || matched.active === false) {
        return res.status(400).json({
          success: false,
          message: 'The requested size variant is unavailable or inactive.'
        });
      }

      targetVariantId = matched.id;
      targetSize = matched.size;
      if (typeof matched.stock === 'number') {
        availableStock = matched.stock;
      }
    }

    if (availableStock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${availableStock} piece(s) available in atelier inventory.`
      });
    }

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [] });
    }

    // Match on product AND variant so different sizes of the same product are distinct items
    const existingIndex = cart.items.findIndex(item => {
      const isSameProduct = item.product.toString() === product._id.toString();
      const isSameVariant = (item.variantId || '') === (targetVariantId || '') &&
                            (item.size || item.selectedVariant || '') === (targetSize || '');
      return isSameProduct && isSameVariant;
    });

    if (existingIndex > -1) {
      const newQty = cart.items[existingIndex].quantity + Number(quantity);
      if (newQty > availableStock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more than ${availableStock} available units.`
        });
      }
      cart.items[existingIndex].quantity = newQty;
    } else {
      cart.items.push({
        product: product._id,
        quantity: Number(quantity),
        variantId: targetVariantId,
        size: targetSize,
        selectedVariant: targetSize
      });
    }

    await cart.save();
    const calculatedCart = await buildAuthoritativeCart(cart);

    res.status(200).json({
      success: true,
      message: `${product.name}${targetSize ? ` (${targetSize})` : ''} placed in your Atelier Bag.`,
      cart: calculatedCart
    });
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity, variantId = '', size = '', itemId = '' } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1.'
      });
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    let item = null;
    if (itemId) {
      item = cart.items.id(itemId);
    }
    if (!item && productId) {
      item = cart.items.id(productId);
    }
    if (!item) {
      const product = await Product.findOne({
        $or: [{ _id: productId && productId.match(/^[0-9a-fA-F]{24}$/) ? productId : null }, { slug: productId }]
      });
      if (product) {
        item = cart.items.find(i => {
          const sameProd = i.product.toString() === product._id.toString();
          const sameVar = !variantId || i.variantId === variantId;
          const sameSize = !size || (i.size || i.selectedVariant) === size;
          return sameProd && sameVar && sameSize;
        });
      }
    }

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not in cart' });
    }

    const product = await Product.findById(item.product);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let availableStock = product.stock;
    if (product.hasVariants && item.variantId) {
      const v = product.variants.find(v => v.id === item.variantId);
      if (v && typeof v.stock === 'number') {
        availableStock = v.stock;
      }
    }

    if (quantity > availableStock) {
      return res.status(400).json({
        success: false,
        message: `Only ${availableStock} units available in stock.`
      });
    }

    item.quantity = Number(quantity);
    await cart.save();

    const calculatedCart = await buildAuthoritativeCart(cart);
    res.status(200).json({
      success: true,
      cart: calculatedCart
    });
  } catch (error) {
    next(error);
  }
};

export const removeCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { variantId = '', itemId = '' } = req.query;

    const cart = await Cart.findOne({ userId: req.user._id });
    if (cart) {
      if (itemId) {
        cart.items = cart.items.filter(i => i._id.toString() !== itemId);
      } else if (productId.match(/^[0-9a-fA-F]{24}$/) && cart.items.some(i => i._id.toString() === productId)) {
        cart.items = cart.items.filter(i => i._id.toString() !== productId);
      } else {
        const product = await Product.findOne({
          $or: [{ _id: productId && productId.match(/^[0-9a-fA-F]{24}$/) ? productId : null }, { slug: productId }]
        });
        const targetId = product ? product._id.toString() : productId;
        cart.items = cart.items.filter(i => {
          const isSameProd = i.product.toString() === targetId;
          const isSameVar = !variantId || i.variantId === variantId;
          return !(isSameProd && isSameVar);
        });
      }
      await cart.save();
    }

    const calculatedCart = await buildAuthoritativeCart(cart);
    res.status(200).json({
      success: true,
      message: 'Item removed from bag.',
      cart: calculatedCart
    });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.status(200).json({
      success: true,
      cart: { items: [], subtotal: 0, totalCount: 0 }
    });
  } catch (error) {
    next(error);
  }
};

// Sync guest cart items into user's DB cart on login
export const syncCart = async (req, res, next) => {
  try {
    const { guestItems = [] } = req.body;

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [] });
    }

    for (const gItem of guestItems) {
      const product = await Product.findOne({
        $or: [
          { _id: gItem.productId && gItem.productId.match(/^[0-9a-fA-F]{24}$/) ? gItem.productId : null },
          { slug: gItem.id || gItem.slug }
        ],
        isActive: true
      });

      if (!product || product.stock <= 0) continue;

      let gVariantId = gItem.variantId || '';
      let gSize = gItem.size || gItem.selectedVariant || '';
      let availableStock = product.stock;

      if (product.hasVariants && Array.isArray(product.variants) && product.variants.length > 0) {
        let matched = null;
        if (gVariantId) matched = product.variants.find(v => v.id === gVariantId);
        if (!matched && gSize) matched = product.variants.find(v => (v.size || '').trim().toLowerCase() === gSize.trim().toLowerCase());
        if (!matched) matched = product.variants.find(v => v.isDefault && v.active !== false) || product.variants.find(v => v.active !== false);

        if (!matched || matched.active === false) continue;
        gVariantId = matched.id;
        gSize = matched.size;
        if (typeof matched.stock === 'number') {
          availableStock = matched.stock;
        }
      }

      const existingIndex = cart.items.findIndex(
        i => i.product.toString() === product._id.toString() &&
             (i.variantId || '') === (gVariantId || '') &&
             (i.size || i.selectedVariant || '') === (gSize || '')
      );

      const qtyToAdd = Number(gItem.quantity) || 1;

      if (existingIndex > -1) {
        cart.items[existingIndex].quantity = Math.min(
          cart.items[existingIndex].quantity + qtyToAdd,
          availableStock
        );
      } else {
        cart.items.push({
          product: product._id,
          quantity: Math.min(qtyToAdd, availableStock),
          variantId: gVariantId,
          size: gSize,
          selectedVariant: gSize
        });
      }
    }

    await cart.save();
    const calculatedCart = await buildAuthoritativeCart(cart);

    res.status(200).json({
      success: true,
      message: 'Atelier bag synchronized.',
      cart: calculatedCart
    });
  } catch (error) {
    next(error);
  }
};
