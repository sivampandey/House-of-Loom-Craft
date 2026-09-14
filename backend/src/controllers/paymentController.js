import crypto from 'crypto';
import Razorpay from 'razorpay';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { Cart } from '../models/Cart.js';
import { Offer } from '../models/Offer.js';
import { decrementStockSafely, generateUniqueOrderNumber } from './orderController.js';

// Lazily initialize Razorpay if keys are configured
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    return null;
  }

  return new Razorpay({
    key_id,
    key_secret
  });
};

export const createRazorpayOrder = async (req, res, next) => {
  try {
    const { items = [], couponCode } = req.body;

    if (!items.length) {
      return res.status(400).json({
        success: false,
        message: 'No items provided to create payment order.'
      });
    }

    // Calculate server-side authoritative total strictly from MongoDB Product records
    let subtotal = 0;
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
          message: `Item "${item.name || 'Selected item'}" is unavailable in atelier records.`
        });
      }

      const qty = Number(item.quantity) || 1;
      if (product.stock < qty) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} units available for "${product.name}".`
        });
      }

      subtotal += product.price * qty;
    }

    // Calculate coupon discount if applicable
    let discount = 0;
    let appliedCode = null;
    if (couponCode && typeof couponCode === 'string') {
      const offer = await Offer.findOne({
        code: couponCode.trim().toUpperCase(),
        isActive: true,
        validFrom: { $lte: new Date() },
        validUntil: { $gte: new Date() }
      });

      if (offer && subtotal >= (offer.minOrderAmount || 0)) {
        if (offer.discountType === 'percentage') {
          discount = (subtotal * offer.discountValue) / 100;
          if (offer.maxDiscountAmount && discount > offer.maxDiscountAmount) {
            discount = offer.maxDiscountAmount;
          }
        } else {
          discount = Math.min(offer.discountValue, subtotal);
        }
        discount = Math.round(discount);
        appliedCode = offer.code;
      }
    }

    const finalPayable = Math.max(0, subtotal - discount);

    // Razorpay works in subunits (paise for INR, 1 INR = 100 paise)
    const amountInPaise = Math.round(finalPayable * 100);
    const receipt = `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const razorpay = getRazorpayInstance();

    if (!razorpay) {
      // Check explicit simulation flag: must not be in production and RAZORPAY_SIMULATION must be true
      const isSimulationAllowed = process.env.NODE_ENV !== 'production' && process.env.RAZORPAY_SIMULATION === 'true';
      if (!isSimulationAllowed) {
        return res.status(503).json({
          success: false,
          message: 'Payment gateway credentials are not configured and simulation is disabled.'
        });
      }

      // Safe local development simulation
      const simulatedOrderId = `order_sim_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      return res.status(200).json({
        success: true,
        isSimulated: true,
        orderId: simulatedOrderId,
        amount: amountInPaise,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_simulation',
        total: finalPayable,
        subtotal,
        discount,
        couponCode: appliedCode
      });
    }

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt,
      payment_capture: 1
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      total: finalPayable,
      subtotal,
      discount,
      couponCode: appliedCode
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPaymentAndCreateOrder = async (req, res, next) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      items = [],
      shippingAddress,
      couponCode
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification parameters missing.'
      });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.addressLine1 || !shippingAddress.city || !shippingAddress.postalCode) {
      return res.status(400).json({
        success: false,
        message: 'A complete delivery address is required for white-glove shipping.'
      });
    }

    // 1. Idempotency Check: prevent duplicate orders if verification is retried
    const existingOrder = await Order.findOne({
      $or: [
        { razorpayPaymentId },
        { razorpayOrderId }
      ]
    });
    if (existingOrder) {
      return res.status(200).json({
        success: true,
        message: 'Order already verified and confirmed.',
        order: existingOrder
      });
    }

    // 2. Validate items & calculate authoritative total from MongoDB Product records
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
          message: 'Product is no longer available in the atelier.'
        });
      }

      const reqQty = Number(item.quantity) || 1;
      calculatedSubtotal += product.price * reqQty;

      validatedItems.push({
        productId: product._id,
        name: product.name,
        image: product.thumbnail || (product.images && product.images[0]) || product.texture,
        price: product.price,
        quantity: reqQty,
        dimensions: product.dimensions,
        material: product.material,
        selectedVariant: item.selectedVariant || ''
      });
    }

    // Calculate coupon discount if applicable
    let couponDiscount = 0;
    let couponOffer = null;
    if (couponCode && typeof couponCode === 'string') {
      const offer = await Offer.findOne({
        code: couponCode.trim().toUpperCase(),
        isActive: true,
        validFrom: { $lte: new Date() },
        validUntil: { $gte: new Date() }
      });

      if (offer && calculatedSubtotal >= (offer.minOrderAmount || 0)) {
        if (offer.discountType === 'percentage') {
          couponDiscount = (calculatedSubtotal * offer.discountValue) / 100;
          if (offer.maxDiscountAmount && couponDiscount > offer.maxDiscountAmount) {
            couponDiscount = offer.maxDiscountAmount;
          }
        } else {
          couponDiscount = Math.min(offer.discountValue, calculatedSubtotal);
        }
        couponDiscount = Math.round(couponDiscount);
        couponOffer = offer;
      }
    }

    const finalOrderTotal = Math.max(0, calculatedSubtotal - couponDiscount);
    const amountInPaise = Math.round(finalOrderTotal * 100);

    // 3. Simulated Payment Security Guard
    const isSimulated = String(razorpayOrderId).startsWith('order_sim_') || String(razorpayPaymentId).startsWith('pay_sim_');
    if (isSimulated) {
      const isSimulationAllowed = process.env.NODE_ENV !== 'production' && process.env.RAZORPAY_SIMULATION === 'true';
      if (!isSimulationAllowed) {
        return res.status(400).json({
          success: false,
          message: 'Simulated payment transactions are disabled in production.'
        });
      }
    } else {
      // 4. Live Razorpay Gateway Verification
      const razorpay = getRazorpayInstance();
      const keySecret = process.env.RAZORPAY_KEY_SECRET;

      if (!razorpay || !keySecret) {
        return res.status(503).json({
          success: false,
          message: 'Payment gateway configuration is missing on the server. Please contact the atelier concierge.'
        });
      }

      if (!razorpaySignature) {
        return res.status(400).json({
          success: false,
          message: 'Cryptographic Razorpay signature is required for payment verification.'
        });
      }

      // Cryptographic HMAC-SHA256 signature verification
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (generatedSignature !== razorpaySignature) {
        return res.status(400).json({
          success: false,
          message: 'Payment signature verification failed. Untrusted transaction.'
        });
      }

      // Live verification with Razorpay REST API
      try {
        const paymentDetails = await razorpay.payments.fetch(razorpayPaymentId);
        if (!paymentDetails) {
          return res.status(400).json({
            success: false,
            message: 'Payment details could not be retrieved from gateway.'
          });
        }

        if (paymentDetails.order_id !== razorpayOrderId) {
          return res.status(400).json({
            success: false,
            message: 'Payment is not associated with the given Razorpay order.'
          });
        }

        if (paymentDetails.currency !== 'INR') {
          return res.status(400).json({
            success: false,
            message: `Invalid currency "${paymentDetails.currency}". Expected INR.`
          });
        }

        if (!['captured', 'authorized'].includes(paymentDetails.status)) {
          return res.status(400).json({
            success: false,
            message: `Payment status is ${paymentDetails.status}; expected captured or authorized.`
          });
        }

        if (Number(paymentDetails.amount) !== amountInPaise) {
          return res.status(400).json({
            success: false,
            message: 'Payment amount mismatch between gateway and authoritative atelier cart.'
          });
        }
      } catch (apiError) {
        return res.status(400).json({
          success: false,
          message: `Razorpay API verification failed: ${apiError.message}`
        });
      }
    }

    // 5. Atomically decrement stock
    const stockResult = await decrementStockSafely(validatedItems);
    if (!stockResult.success) {
      // Inventory became unavailable after payment.
      // Record order with refund_required status so money is tracked and an inconsistent confirmed order is NOT created.
      const orderNumber = await generateUniqueOrderNumber();
      const flaggedOrder = await Order.create({
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
        shippingFee: 0,
        tax: 0,
        discount: 0,
        total: calculatedSubtotal,
        paymentMethod: 'online',
        paymentStatus: 'refund_required',
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature: razorpaySignature || '',
        orderStatus: 'cancelled',
        statusHistory: [
          {
            status: 'cancelled',
            timestamp: new Date(),
            note: `Payment captured (${razorpayPaymentId}) but stock became unavailable: ${stockResult.error}. Flagged for concierge refund.`
          }
        ]
      });

      return res.status(409).json({
        success: false,
        message: 'Piece stock became unavailable during checkout finalization. The atelier concierge has flagged your payment for an immediate full refund.',
        order: flaggedOrder
      });
    }

    // 6. Create verified application order
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
      shippingFee: 0,
      tax: 0,
      discount: couponDiscount,
      couponCode: couponOffer ? couponOffer.code : undefined,
      couponDiscount: couponDiscount,
      total: finalOrderTotal,
      paymentMethod: 'online',
      paymentStatus: 'completed',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature: razorpaySignature || '',
      orderStatus: 'confirmed',
      statusHistory: [
        {
          status: 'confirmed',
          timestamp: new Date(),
          note: `Payment verified (${razorpayPaymentId}). Order confirmed.${couponOffer ? ` Applied coupon ${couponOffer.code} (₹${couponDiscount} discount).` : ''}`
        }
      ]
    });

    // Record coupon usage if applicable
    if (couponOffer) {
      await Offer.updateOne(
        { _id: couponOffer._id },
        {
          $inc: { usedCount: 1 },
          $push: {
            usedBy: {
              userId: req.user._id,
              orderId: order._id,
              usedAt: new Date()
            }
          }
        }
      );
    }

    // Clear cart
    await Cart.findOneAndUpdate({ userId: req.user._id }, { items: [] });

    res.status(201).json({
      success: true,
      message: 'Payment verified and order confirmed successfully.',
      order
    });
  } catch (error) {
    next(error);
  }
};
