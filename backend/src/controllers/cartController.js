import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';

// Helper to format cart with authoritative product data and server-calculated totals
const buildAuthoritativeCart = async (cartDoc) => {
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

  for (const item of cartDoc.items) {
    const product = await Product.findById(item.product);
    if (!product || !product.isActive || product.stock <= 0) {
      outOfStockItemsRemoved = true;
      continue;
    }

    // Ensure requested quantity does not exceed available stock
    const validQty = Math.min(item.quantity, product.stock);
    const itemSubtotal = product.price * validQty;

    subtotal += itemSubtotal;
    totalCount += validQty;

    populatedItems.push({
      _id: item._id,
      productId: product._id,
      id: product.slug, // For frontend compatibility
      slug: product.slug,
      name: product.name,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      image: product.thumbnail || (product.images && product.images[0]) || product.texture,
      texture: product.texture,
      dimensions: product.dimensions,
      material: product.material,
      collection: product.collection,
      collectionName: product.collectionName,
      stock: product.stock,
      quantity: validQty,
      selectedVariant: item.selectedVariant || ''
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
    const { productId, quantity = 1, selectedVariant = '' } = req.body;

    const product = await Product.findOne({
      $or: [{ _id: productId.match(/^[0-9a-fA-F]{24}$/) ? productId : null }, { slug: productId }],
      isActive: true
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product is unavailable or does not exist.'
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} piece(s) available in atelier inventory.`
      });
    }

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [] });
    }

    const existingIndex = cart.items.findIndex(
      item => item.product.toString() === product._id.toString()
    );

    if (existingIndex > -1) {
      const newQty = cart.items[existingIndex].quantity + Number(quantity);
      if (newQty > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more than ${product.stock} available units.`
        });
      }
      cart.items[existingIndex].quantity = newQty;
    } else {
      cart.items.push({
        product: product._id,
        quantity: Number(quantity),
        selectedVariant
      });
    }

    await cart.save();
    const calculatedCart = await buildAuthoritativeCart(cart);

    res.status(200).json({
      success: true,
      message: `${product.name} placed in your Atelier Bag.`,
      cart: calculatedCart
    });
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1.'
      });
    }

    const product = await Product.findOne({
      $or: [{ _id: productId.match(/^[0-9a-fA-F]{24}$/) ? productId : null }, { slug: productId }]
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} units available in stock.`
      });
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const item = cart.items.find(i => i.product.toString() === product._id.toString());
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not in cart' });
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

    const product = await Product.findOne({
      $or: [{ _id: productId.match(/^[0-9a-fA-F]{24}$/) ? productId : null }, { slug: productId }]
    });

    const targetId = product ? product._id.toString() : productId;

    const cart = await Cart.findOne({ userId: req.user._id });
    if (cart) {
      cart.items = cart.items.filter(i => i.product.toString() !== targetId);
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

      const existingIndex = cart.items.findIndex(
        i => i.product.toString() === product._id.toString()
      );

      const qtyToAdd = Number(gItem.quantity) || 1;

      if (existingIndex > -1) {
        cart.items[existingIndex].quantity = Math.min(
          cart.items[existingIndex].quantity + qtyToAdd,
          product.stock
        );
      } else {
        cart.items.push({
          product: product._id,
          quantity: Math.min(qtyToAdd, product.stock),
          selectedVariant: gItem.selectedVariant || ''
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
