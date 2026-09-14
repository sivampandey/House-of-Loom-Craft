import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Cart } from '../models/Cart.js';
import { Offer } from '../models/Offer.js';

// Helper to atomically decrement stock for order items
export const decrementStockSafely = async (items) => {
  const decremented = [];
  try {
    for (const item of items) {
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.productId, stock: { $gte: item.quantity }, isActive: true },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );

      if (!updatedProduct) {
        // Rollback already decremented items
        for (const rolled of decremented) {
          await Product.findByIdAndUpdate(rolled.productId, {
            $inc: { stock: rolled.quantity }
          });
        }
        return {
          success: false,
          error: `Insufficient inventory for piece "${item.name}". Stock was acquired during checkout.`
        };
      }

      decremented.push(item);
    }
    return { success: true };
  } catch (err) {
    // Rollback
    for (const rolled of decremented) {
      await Product.findByIdAndUpdate(rolled.productId, {
        $inc: { stock: rolled.quantity }
      });
    }
    return { success: false, error: err.message };
  }
};

// Helper to generate a collision-free order number with database verification and retries
export const generateUniqueOrderNumber = async () => {
  const maxRetries = 10;
  for (let i = 0; i < maxRetries; i++) {
    const timestampPart = Date.now().toString().slice(-4);
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    const candidate = `PR-${timestampPart}${randomPart}`;
    const exists = await Order.exists({ orderNumber: candidate });
    if (!exists) return candidate;
  }
  // High-entropy fallback
  return `PR-${Date.now().toString().slice(-6)}${Math.floor(10000 + Math.random() * 90000)}`;
};

export const createOrder = async (req, res, next) => {
  try {
    const {
      items = [],
      shippingAddress,
      paymentMethod = 'cod'
    } = req.body;

    // Security Gate: Reject direct online order creation through this endpoint.
    // Online orders must strictly be finalized via the verified payment flow (/api/payments/verify).
    if (paymentMethod === 'online') {
      return res.status(400).json({
        success: false,
        message: 'Online orders cannot be placed directly through this endpoint. Please complete payment verification via /api/payments/verify.'
      });
    }

    if (paymentMethod !== 'cod') {
      return res.status(400).json({
        success: false,
        message: `Invalid payment method "${paymentMethod}". Only 'cod' is accepted directly on this endpoint.`
      });
    }

    if (!items.length) {
      return res.status(400).json({
        success: false,
        message: 'Your atelier order cannot be created with an empty bag.'
      });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.addressLine1 || !shippingAddress.city || !shippingAddress.postalCode) {
      return res.status(400).json({
        success: false,
        message: 'A complete delivery address is required for white-glove shipping.'
      });
    }

    // Server-side authoritative validation and calculation
    const validatedItems = [];
    let calculatedSubtotal = 0;

    for (const item of items) {
      const pId = item.productId || item._id;
      const product = await Product.findOne({
        $or: [
          { _id: pId && pId.match(/^[0-9a-fA-F]{24}$/) ? pId : null },
          { slug: item.id || item.slug }
        ],
        isActive: true
      });

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product "${item.name || 'Selected item'}" is no longer available in the atelier.`
        });
      }

      const reqQty = Number(item.quantity) || 1;
      if (reqQty < 1) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for piece "${product.name}".`
        });
      }

      if (product.stock < reqQty) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} available for "${product.name}". Please adjust your order.`
        });
      }

      // Read price strictly from authoritative DB record
      const itemPrice = product.price;
      calculatedSubtotal += itemPrice * reqQty;

      // Historical immutable snapshot of ordered piece
      validatedItems.push({
        productId: product._id,
        name: product.name,
        image: product.thumbnail || (product.images && product.images[0]) || product.texture,
        price: itemPrice,
        quantity: reqQty,
        dimensions: product.dimensions,
        material: product.material,
        selectedVariant: item.selectedVariant || ''
      });
    }

    // Complimentary insured white-glove shipping
    const shippingFee = 0;
    // Taxes included in luxury listing prices
    const tax = 0;

    // Server-side authoritative coupon calculation
    let discount = 0;
    let appliedCouponCode = '';
    const { couponCode } = req.body;

    if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
      const cleanCode = couponCode.trim().toUpperCase();
      const offer = await Offer.findOne({ code: cleanCode, isActive: true });
      if (offer) {
        const now = new Date();
        const isDateValid = (!offer.startDate || now >= offer.startDate) && (!offer.endDate || now <= offer.endDate);
        const isLimitValid = offer.usageLimit === null || offer.usedCount < offer.usageLimit;
        const isMinValid = !offer.minOrderValue || calculatedSubtotal >= offer.minOrderValue;

        if (isDateValid && isLimitValid && isMinValid) {
          if (offer.discountType === 'percentage') {
            discount = Math.round((calculatedSubtotal * offer.discountValue) / 100);
            if (offer.maxDiscount && discount > offer.maxDiscount) {
              discount = offer.maxDiscount;
            }
          } else if (offer.discountType === 'fixed') {
            discount = Math.min(offer.discountValue, calculatedSubtotal);
          }
          appliedCouponCode = offer.code;
        }
      }
    }

    discount = Math.max(0, discount);
    const finalTotal = Math.max(0, calculatedSubtotal + shippingFee + tax - discount);

    // Payment validation rules
    let paymentStatus = 'pending';
    let orderStatus = 'confirmed';

    if (paymentMethod === 'online') {
      if (!razorpayPaymentId) {
        return res.status(400).json({
          success: false,
          message: 'Online orders require verified payment confirmation.'
        });
      }
      paymentStatus = 'completed';
      orderStatus = 'confirmed';
    } else {
      // COD
      paymentStatus = 'pending';
      orderStatus = 'confirmed';
    }

    // Atomically decrement stock
    const stockResult = await decrementStockSafely(validatedItems);
    if (!stockResult.success) {
      return res.status(409).json({
        success: false,
        message: stockResult.error
      });
    }

    // Generate unique order number with collision protection
    const orderNumber = await generateUniqueOrderNumber();

    const order = await Order.create({
      orderNumber,
      userId: req.user._id,
      items: validatedItems,
      shippingAddress: {
        fullName: shippingAddress.fullName.trim(),
        phone: shippingAddress.phone.trim(),
        addressLine1: shippingAddress.addressLine1.trim(),
        addressLine2: (shippingAddress.addressLine2 || '').trim(),
        city: shippingAddress.city.trim(),
        state: shippingAddress.state.trim(),
        postalCode: shippingAddress.postalCode.trim(),
        country: (shippingAddress.country || 'India').trim(),
        landmark: (shippingAddress.landmark || '').trim()
      },
      subtotal: calculatedSubtotal,
      shippingFee,
      tax,
      discount,
      total: finalTotal,
      couponCode: appliedCouponCode,
      couponDiscount: discount,
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      razorpayOrderId: null,
      razorpayPaymentId: null,
      razorpaySignature: '',
      orderStatus: 'confirmed',
      statusHistory: [
        {
          status: 'confirmed',
          timestamp: new Date(),
          note: appliedCouponCode 
            ? `Order placed with Cash on Delivery (COD). Coupon "${appliedCouponCode}" applied (₹${discount} discount).`
            : 'Order placed with Cash on Delivery (COD)'
        }
      ]
    });

    // Record coupon usage if coupon was applied
    if (appliedCouponCode) {
      await Offer.findOneAndUpdate(
        { code: appliedCouponCode },
        {
          $inc: { usedCount: 1 },
          $push: {
            usedBy: {
              userId: req.user._id,
              orderNumber,
              discountApplied: discount,
              usedAt: new Date()
            }
          }
        }
      );
    }

    // Clear cart if ordered items were in user's cart
    await Cart.findOneAndUpdate({ userId: req.user._id }, { items: [] });

    res.status(201).json({
      success: true,
      message: 'Atelier acquisition confirmed successfully.',
      order
    });
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    // Search by orderNumber or MongoDB _id
    const query = {
      $or: [
        { orderNumber: orderId },
        { _id: orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null }
      ]
    };

    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order reference could not be found in atelier records.'
      });
    }

    // Strict privacy: customer can ONLY access their own orders unless admin
    if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this atelier order record.'
      });
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    next(error);
  }
};

// Helper to atomically restore stock for cancelled order items
export const restoreOrderStockSafely = async (order) => {
  if (!order.items || !order.items.length) return;
  for (const item of order.items) {
    if (item.productId) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity }
      });
    }
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const query = {
      $or: [
        { orderNumber: orderId },
        { _id: orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null }
      ]
    };

    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    // Ownership check
    if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this order.'
      });
    }

    // Idempotency: If already cancelled, do not restore stock twice
    if (order.orderStatus === 'cancelled') {
      return res.status(200).json({
        success: true,
        message: 'Order is already cancelled.',
        order
      });
    }

    // Cancellation business rules
    const cancellableStatuses = ['pending', 'confirmed'];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled in its current state (${order.orderStatus}). Once in crafting or dispatch, please contact the atelier concierge.`
      });
    }

    // Atomically restore inventory stock exactly once
    await restoreOrderStockSafely(order);

    order.orderStatus = 'cancelled';
    order.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: req.body.reason || 'Cancelled by client request'
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Your order cancellation has been processed.',
      order
    });
  } catch (error) {
    next(error);
  }
};

// Admin status update
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;

    const allowed = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const previousStatus = order.orderStatus;

    // If transitioning to cancelled and was NOT already cancelled, restore inventory
    if (status === 'cancelled' && previousStatus !== 'cancelled') {
      await restoreOrderStockSafely(order);
    }

    order.orderStatus = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Status updated from ${previousStatus} to ${status}`
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order
    });
  } catch (error) {
    next(error);
  }
};
