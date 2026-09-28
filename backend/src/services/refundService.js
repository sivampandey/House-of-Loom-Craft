import Razorpay from 'razorpay';
import { restoreOrderStockSafely } from '../controllers/orderController.js';

// Lazily get Razorpay instance
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

/**
 * Idempotent Razorpay Refund Processor
 * Safely processes refunds for online paid orders, restores stock exactly once,
 * and maintains accurate audit log without exposing gateway secrets.
 */
export const processOrderRefund = async ({ order, refundAmount, reason = 'Order cancellation', initiatedBy = 'system' }) => {
  if (!order) {
    throw new Error('Order document is required to process refund.');
  }

  // If order is COD, online refund is not applicable
  if (order.paymentMethod !== 'online') {
    return {
      success: true,
      message: 'Cash on Delivery order does not require digital gateway refund.',
      order
    };
  }

  // Idempotency: If already refunded
  if (order.paymentStatus === 'refunded' && order.refundStatus === 'processed') {
    // Ensure stock was restored exactly once
    if (!order.stockRestored && order.orderStatus === 'cancelled') {
      await restoreOrderStockSafely(order);
      order.stockRestored = true;
      await order.save();
    }
    return {
      success: true,
      message: 'This order has already been fully refunded.',
      alreadyRefunded: true,
      order
    };
  }

  // Simulated Development Flow
  const isSimulation = process.env.NODE_ENV !== 'production' && process.env.RAZORPAY_SIMULATION === 'true';
  const isSimulatedPayment = String(order.razorpayPaymentId || '').startsWith('pay_sim_');

  if (isSimulation || isSimulatedPayment) {
    const simulatedRefundId = `rfnd_sim_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const effectiveAmount = refundAmount || order.currencyAmount || order.total;

    order.refundId = simulatedRefundId;
    order.refundAmount = effectiveAmount;
    order.refundStatus = 'processed';
    order.paymentStatus = 'refunded';
    order.refundedAt = new Date();
    order.refundReason = reason;

    if (!order.stockRestored) {
      await restoreOrderStockSafely(order);
      order.stockRestored = true;
    }

    order.statusHistory.push({
      status: order.orderStatus,
      timestamp: new Date(),
      note: `Simulated refund (${simulatedRefundId}) of ${order.currency || 'INR'} ${effectiveAmount} processed by ${initiatedBy}. Reason: ${reason}`
    });

    await order.save();

    return {
      success: true,
      isSimulated: true,
      refundId: simulatedRefundId,
      message: 'Simulated refund processed successfully.',
      order
    };
  }

  // Live Gateway Verification & Execution
  const razorpay = getRazorpayInstance();
  if (!razorpay) {
    throw new Error('Razorpay gateway credentials are not configured on the server.');
  }

  if (!order.razorpayPaymentId) {
    throw new Error('Order does not have an associated Razorpay Payment ID to refund.');
  }

  try {
    // 1. Fetch payment details from Razorpay to verify capture state
    const payment = await razorpay.payments.fetch(order.razorpayPaymentId);
    if (!payment) {
      throw new Error(`Unable to fetch payment ${order.razorpayPaymentId} from Razorpay.`);
    }

    // Check if already refunded on Razorpay side
    if (payment.amount_refunded >= payment.amount || payment.status === 'refunded') {
      order.refundStatus = 'processed';
      order.paymentStatus = 'refunded';
      order.refundAmount = payment.amount_refunded / 100;
      order.refundedAt = new Date();

      if (!order.stockRestored) {
        await restoreOrderStockSafely(order);
        order.stockRestored = true;
      }

      order.statusHistory.push({
        status: order.orderStatus,
        timestamp: new Date(),
        note: `Payment was already marked refunded on Razorpay. Atelier record synchronized.`
      });

      await order.save();
      return {
        success: true,
        alreadyRefunded: true,
        message: 'Payment was already refunded on Razorpay gateway.',
        order
      };
    }

    // Payment must be captured to be refundable
    if (payment.status !== 'captured') {
      throw new Error(`Payment cannot be refunded because its status on Razorpay is "${payment.status}" (expected "captured").`);
    }

    // Calculate refund amount in subunits (paise / cents)
    const targetAmount = refundAmount || order.currencyAmount || order.total;
    let refundSubunits = Math.round(targetAmount * 100);

    const remainingRefundable = payment.amount - (payment.amount_refunded || 0);
    if (refundSubunits > remainingRefundable) {
      refundSubunits = remainingRefundable;
    }

    if (refundSubunits <= 0) {
      throw new Error('No refundable balance remaining on this payment.');
    }

    // 2. Execute refund via Razorpay API
    const refundOptions = {
      amount: refundSubunits,
      notes: {
        orderNumber: String(order.orderNumber),
        initiatedBy: String(initiatedBy),
        reason: String(reason).slice(0, 100)
      }
    };

    const refund = await razorpay.payments.refund(order.razorpayPaymentId, refundOptions);

    // 3. Update order state based on actual refund result
    order.refundId = refund.id;
    order.refundAmount = refund.amount / 100;
    order.refundReason = reason;
    order.refundedAt = new Date(refund.created_at ? refund.created_at * 1000 : Date.now());

    if (refund.status === 'processed') {
      order.refundStatus = 'processed';
      order.paymentStatus = 'refunded';
    } else {
      // Pending gateway processing
      order.refundStatus = 'initiated';
      order.paymentStatus = 'refund_pending';
    }

    // 4. Restore stock exactly once
    if (!order.stockRestored) {
      await restoreOrderStockSafely(order);
      order.stockRestored = true;
    }

    order.statusHistory.push({
      status: order.orderStatus,
      timestamp: new Date(),
      note: `Razorpay refund (${refund.id}) of ${order.currency || 'INR'} ${refund.amount / 100} initiated (${refund.status}). Initiated by: ${initiatedBy}. Reason: ${reason}`
    });

    await order.save();

    return {
      success: true,
      refundId: refund.id,
      refundStatus: refund.status,
      amount: refund.amount / 100,
      order
    };
  } catch (err) {
    // Gateway refund call failed
    console.error('[Razorpay Refund Error]:', err.error?.description || err.message);

    order.refundStatus = 'failed';
    order.paymentStatus = 'refund_required';

    // If order is cancelled, we still restore stock so inventory is accurate
    if (!order.stockRestored && order.orderStatus === 'cancelled') {
      await restoreOrderStockSafely(order);
      order.stockRestored = true;
    }

    order.statusHistory.push({
      status: order.orderStatus,
      timestamp: new Date(),
      note: `Refund attempt failed: ${err.error?.description || err.message}. Flagged for manual concierge refund.`
    });

    await order.save();

    return {
      success: false,
      error: err.error?.description || err.message,
      order
    };
  }
};
