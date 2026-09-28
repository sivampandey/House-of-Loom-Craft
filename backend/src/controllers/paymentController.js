import crypto from 'crypto';
import Razorpay from 'razorpay';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { Cart } from '../models/Cart.js';
import { Offer } from '../models/Offer.js';
import { decrementStockSafely, generateUniqueOrderNumber, restoreOrderStockSafely } from './orderController.js';
import { getExchangeRate, convertFromINR, SUPPORTED_CURRENCY_CODES } from '../services/currencyService.js';
import { processOrderRefund } from '../services/refundService.js';

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
    const { items = [], couponCode, currency: rawCurrency } = req.body;
    const currency = (rawCurrency && typeof rawCurrency === 'string' && SUPPORTED_CURRENCY_CODES.includes(rawCurrency.toUpperCase()))
      ? rawCurrency.toUpperCase()
      : 'INR';

    if (!items.length) {
      return res.status(400).json({
        success: false,
        message: 'No items provided to create payment order.'
      });
    }

    // Calculate server-side authoritative total strictly from MongoDB Product records in INR
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

    const finalPayableINR = Math.max(0, subtotal - discount);
    let exchangeRate = 1;
    let currencyAmount = finalPayableINR;

    if (currency !== 'INR') {
      try {
        exchangeRate = await getExchangeRate(currency, { forTransaction: true });
        currencyAmount = await convertFromINR(finalPayableINR, currency, { forTransaction: true });
      } catch (rateErr) {
        return res.status(503).json({
          success: false,
          message: 'International payment is currently unavailable. Please contact House of Loom & Craft for assistance.'
        });
      }
    }

    // Razorpay works in lowest denomination subunits (paise for INR, cents for USD/EUR/AUD/CAD/SGD, pence for GBP, fils for AED)
    const amountInSubunits = Math.round(currencyAmount * 100);
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
        amount: amountInSubunits,
        currency,
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_simulation',
        total: currencyAmount,
        baseAmountINR: finalPayableINR,
        currencyAmount,
        exchangeRate,
        subtotal,
        discount,
        couponCode: appliedCode
      });
    }

    try {
      const options = {
        amount: amountInSubunits,
        currency,
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
        total: currencyAmount,
        baseAmountINR: finalPayableINR,
        currencyAmount,
        exchangeRate,
        subtotal,
        discount,
        couponCode: appliedCode
      });
    } catch (gatewayErr) {
      console.error('[Razorpay Order Creation Error]:', gatewayErr);
      if (currency !== 'INR') {
        return res.status(400).json({
          success: false,
          message: 'International payment is currently unavailable. Please contact House of Loom & Craft for assistance.'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Payment order creation failed: ${gatewayErr.error?.description || gatewayErr.message}`
      });
    }
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
      couponCode,
      currency: rawCurrency
    } = req.body;

    const currency = (rawCurrency && typeof rawCurrency === 'string' && SUPPORTED_CURRENCY_CODES.includes(rawCurrency.toUpperCase()))
      ? rawCurrency.toUpperCase()
      : 'INR';

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

    const finalOrderTotalINR = Math.max(0, calculatedSubtotal - couponDiscount);
    let exchangeRate = 1;
    let currencyAmount = finalOrderTotalINR;

    if (currency !== 'INR') {
      try {
        exchangeRate = await getExchangeRate(currency, { forTransaction: true });
        currencyAmount = await convertFromINR(finalOrderTotalINR, currency, { forTransaction: true });
      } catch (rateErr) {
        return res.status(503).json({
          success: false,
          message: 'International payment is currently unavailable. Please contact House of Loom & Craft for assistance.'
        });
      }
    }

    const expectedSubunits = Math.round(currencyAmount * 100);

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

        if (paymentDetails.currency.toUpperCase() !== currency) {
          return res.status(400).json({
            success: false,
            message: `Invalid currency "${paymentDetails.currency}". Expected ${currency}.`
          });
        }

        let isCaptured = paymentDetails.status === 'captured';
        if (paymentDetails.status === 'authorized') {
          try {
            const captureResponse = await razorpay.payments.capture(razorpayPaymentId, expectedSubunits, currency);
            if (captureResponse && captureResponse.status === 'captured') {
              isCaptured = true;
            }
          } catch (captureErr) {
            console.error('[Razorpay Auto-Capture Error]:', captureErr.message);
          }
        }

        if (!isCaptured) {
          return res.status(400).json({
            success: false,
            message: `Payment status is "${paymentDetails.status}". Only CAPTURED payments can be fulfilled for orders.`
          });
        }

        if (Number(paymentDetails.amount) !== expectedSubunits) {
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
        total: finalOrderTotalINR,
        baseAmountINR: finalOrderTotalINR,
        currency,
        currencyAmount,
        exchangeRate,
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

      // Automatically trigger refund for unavailable inventory
      try {
        await processOrderRefund({
          order: flaggedOrder,
          reason: 'Stock unavailable during checkout confirmation',
          initiatedBy: 'System Auto-Refund'
        });
      } catch (refundErr) {
        console.error('[Auto Refund on Stock Shortage Failed]:', refundErr.message);
      }

      return res.status(409).json({
        success: false,
        message: 'Piece stock became unavailable during checkout finalization. The atelier concierge has flagged your payment for an immediate full refund.',
        order: flaggedOrder
      });
    }

    // 6. Create verified application order with rollback safety
    const orderNumber = await generateUniqueOrderNumber();
    let order;

    try {
      order = await Order.create({
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
        total: finalOrderTotalINR,
        baseAmountINR: finalOrderTotalINR,
        currency,
        currencyAmount,
        exchangeRate,
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
            note: `Payment verified (${razorpayPaymentId}) for ${currency === 'INR' ? '₹' : ''}${currencyAmount} ${currency}${currency !== 'INR' ? ` (Base INR: ₹${finalOrderTotalINR.toLocaleString('en-IN')})` : ''}. Order confirmed.${couponOffer ? ` Applied coupon ${couponOffer.code} (₹${couponDiscount} discount).` : ''}`
          }
        ]
      });
    } catch (orderCreateErr) {
      // Stock was decremented, but creating order failed - rollback immediately to avoid inventory leak
      await restoreOrderStockSafely({ items: validatedItems });

      if (orderCreateErr.code === 11000) {
        // Racing duplicate request created order concurrently
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
      }

      throw orderCreateErr;
    }

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

/**
 * Razorpay Webhook Handler
 * Verifies raw request HMAC-SHA256 signature using RAZORPAY_WEBHOOK_SECRET.
 * Idempotently handles payment.captured, payment.failed, refund.created,
 * refund.processed, refund.failed, and order.paid.
 */
export const handleRazorpayWebhook = async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];

  if (!webhookSecret) {
    console.error('[Razorpay Webhook Error]: RAZORPAY_WEBHOOK_SECRET is not configured on the server.');
    return res.status(500).json({ success: false, message: 'Webhook secret not configured on server.' });
  }

  if (!signature || !req.rawBody) {
    console.warn('[Razorpay Webhook Warning]: Webhook request received without signature or raw body.');
    return res.status(400).json({ success: false, message: 'Missing signature header or raw body payload.' });
  }

  // Cryptographic signature verification using raw request body Buffer
  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.rawBody)
      .digest('hex');

    const signatureBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

    if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      console.warn('[Razorpay Webhook Warning]: Invalid webhook signature detected.');
      return res.status(400).json({ success: false, message: 'Invalid cryptographic webhook signature.' });
    }
  } catch (sigErr) {
    console.error('[Razorpay Webhook Signature Check Error]:', sigErr.message);
    return res.status(400).json({ success: false, message: 'Webhook signature verification failed.' });
  }

  const event = req.body;
  const eventName = event?.event;
  console.log(`[Razorpay Webhook]: Verified incoming event "${eventName}"`);

  try {
    switch (eventName) {
      case 'payment.captured': {
        const payment = event.payload?.payment?.entity;
        if (payment && (payment.order_id || payment.id)) {
          const order = await Order.findOne({
            $or: [
              { razorpayOrderId: payment.order_id },
              { razorpayPaymentId: payment.id }
            ]
          });

          if (order) {
            // Idempotent: only update if not already marked completed
            if (order.paymentStatus !== 'completed') {
              order.paymentStatus = 'completed';
              order.razorpayPaymentId = payment.id;
              if (order.orderStatus === 'pending') {
                order.orderStatus = 'confirmed';
              }
              order.statusHistory.push({
                status: order.orderStatus,
                timestamp: new Date(),
                note: `Payment confirmed captured via Razorpay webhook (${payment.id}).`
              });
              await order.save();
            }
          }
        }
        break;
      }

      case 'payment.failed': {
        const payment = event.payload?.payment?.entity;
        if (payment && (payment.order_id || payment.id)) {
          const order = await Order.findOne({
            $or: [
              { razorpayOrderId: payment.order_id },
              { razorpayPaymentId: payment.id }
            ]
          });

          if (order && order.paymentStatus !== 'completed') {
            order.paymentStatus = 'failed';
            order.statusHistory.push({
              status: order.orderStatus,
              timestamp: new Date(),
              note: `Payment failed on gateway (${payment.id}): ${payment.error_description || 'Payment failed'}`
            });
            await order.save();
          }
        }
        break;
      }

      case 'refund.created':
      case 'refund.processed': {
        const refund = event.payload?.refund?.entity;
        if (refund && refund.payment_id) {
          const order = await Order.findOne({
            $or: [
              { razorpayPaymentId: refund.payment_id },
              { refundId: refund.id }
            ]
          });

          if (order) {
            order.refundId = refund.id;
            order.refundAmount = refund.amount ? refund.amount / 100 : order.refundAmount;
            order.refundStatus = refund.status === 'processed' ? 'processed' : 'initiated';
            order.paymentStatus = refund.status === 'processed' ? 'refunded' : 'refund_pending';
            if (refund.created_at) {
              order.refundedAt = new Date(refund.created_at * 1000);
            }

            // Restore stock exactly once
            if (!order.stockRestored && order.orderStatus === 'cancelled') {
              await restoreOrderStockSafely(order);
              order.stockRestored = true;
            }

            order.statusHistory.push({
              status: order.orderStatus,
              timestamp: new Date(),
              note: `Razorpay refund webhook (${eventName}): ${refund.id} of ${order.currency || 'INR'} ${refund.amount / 100} (${refund.status}).`
            });

            await order.save();
          }
        }
        break;
      }

      case 'refund.failed': {
        const refund = event.payload?.refund?.entity;
        if (refund && refund.payment_id) {
          const order = await Order.findOne({
            $or: [
              { razorpayPaymentId: refund.payment_id },
              { refundId: refund.id }
            ]
          });

          if (order) {
            order.refundStatus = 'failed';
            order.paymentStatus = 'refund_required';
            order.statusHistory.push({
              status: order.orderStatus,
              timestamp: new Date(),
              note: `Razorpay refund failure webhook for ${refund.id}. Flagged for manual concierge investigation.`
            });
            await order.save();
          }
        }
        break;
      }

      case 'order.paid': {
        const rzpOrder = event.payload?.order?.entity;
        if (rzpOrder && rzpOrder.id) {
          const order = await Order.findOne({ razorpayOrderId: rzpOrder.id });
          if (order && order.paymentStatus !== 'completed') {
            order.paymentStatus = 'completed';
            if (order.orderStatus === 'pending') {
              order.orderStatus = 'confirmed';
            }
            order.statusHistory.push({
              status: order.orderStatus,
              timestamp: new Date(),
              note: `Order verified paid via Razorpay order.paid webhook (${rzpOrder.id}).`
            });
            await order.save();
          }
        }
        break;
      }

      default:
        // Ignore unhandled event types cleanly
        break;
    }

    return res.status(200).json({ status: 'ok', event: eventName });
  } catch (err) {
    console.error('[Razorpay Webhook Error]:', err.message);
    return res.status(200).json({ status: 'error_logged', message: err.message });
  }
};

