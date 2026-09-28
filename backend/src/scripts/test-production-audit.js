import crypto from 'crypto';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve DNS for Windows
if (dns.getServers().includes('127.0.0.1')) {
  try {
    dns.setServers(['1.1.1.1', '8.8.8.8']);
  } catch (err) {}
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { processOrderRefund } from '../services/refundService.js';
import { handleRazorpayWebhook } from '../controllers/paymentController.js';
import { decrementStockSafely, restoreOrderStockSafely } from '../controllers/orderController.js';

function mockRes() {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    }
  };
  return res;
}

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

async function runAuditTests() {
  console.log('================================================================');
  console.log('  HOUSE OF LOOM & CRAFT — PRODUCTION READINESS TEST SUITE');
  console.log('================================================================\n');

  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.error('MONGODB_URI not found. Skipping DB-dependent tests.');
    return;
  }

  try {
    await mongoose.connect(mongoURI);
    console.log('[Connected to Database successfully]\n');
  } catch (err) {
    console.error('[Database Connection Failed]:', err.message);
    return;
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: Stock Decrement & Atomic Rollback Safety
    // -------------------------------------------------------------
    console.log('TEST SUITE 1: Stock Safety & Atomic Operations');

    // Create a temporary test product
    const testProduct = await Product.create({
      name: 'Test Heirloom Silk Rug',
      slug: `test-silk-rug-${Date.now()}`,
      description: 'Test piece description for production readiness audit.',
      price: 25000,
      stock: 5,
      category: 'Hand Knotted Rugs',
      collection: 'hand-knotted'
    });

    assert(testProduct.stock === 5, 'Test product initialized with stock 5');

    // 1. Decrement valid quantity (2)
    const decRes1 = await decrementStockSafely([
      { productId: testProduct._id, name: testProduct.name, quantity: 2 }
    ]);
    const afterDec1 = await Product.findById(testProduct._id);
    assert(decRes1.success === true && afterDec1.stock === 3, 'Decrement 2 units leaves stock at 3');

    // 2. Attempt to decrement excessive quantity (10) -> Should fail atomically
    const decRes2 = await decrementStockSafely([
      { productId: testProduct._id, name: testProduct.name, quantity: 10 }
    ]);
    const afterDec2 = await Product.findById(testProduct._id);
    assert(decRes2.success === false && afterDec2.stock === 3, 'Excessive quantity rejected without altering stock (atomic safety)');

    // 3. Test Idempotent restoreOrderStockSafely
    const fakeOrder = {
      orderNumber: `TEST-ORD-${Date.now()}`,
      stockRestored: false,
      items: [{ productId: testProduct._id, quantity: 2 }]
    };

    await restoreOrderStockSafely(fakeOrder);
    const afterRestore1 = await Product.findById(testProduct._id);
    assert(afterRestore1.stock === 5 && fakeOrder.stockRestored === true, 'Restoring stock returns inventory to 5 and sets stockRestored=true');

    // Restore second time should be a no-op because stockRestored is true
    await restoreOrderStockSafely(fakeOrder);
    const afterRestore2 = await Product.findById(testProduct._id);
    assert(afterRestore2.stock === 5, 'Duplicate restoreOrderStockSafely call is idempotent and does NOT double-restore');

    // -------------------------------------------------------------
    // TEST 2: Razorpay Webhook Cryptographic Verification
    // -------------------------------------------------------------
    console.log('\nTEST SUITE 2: Razorpay Webhook Cryptographic Signature Verification');

    const testWebhookSecret = 'test_webhook_secret_998877';
    process.env.RAZORPAY_WEBHOOK_SECRET = testWebhookSecret;

    const webhookPayload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test_webhook_123',
            order_id: 'order_test_webhook_456',
            amount: 2500000,
            currency: 'INR',
            status: 'captured'
          }
        }
      }
    });

    const validSignature = crypto
      .createHmac('sha256', testWebhookSecret)
      .update(Buffer.from(webhookPayload, 'utf8'))
      .digest('hex');

    const invalidSignature = 'tampered_invalid_signature_12345';

    // A. Rejection of invalid signature
    const reqInvalid = {
      headers: { 'x-razorpay-signature': invalidSignature },
      rawBody: Buffer.from(webhookPayload, 'utf8'),
      body: JSON.parse(webhookPayload)
    };
    const resInvalid = mockRes();
    await handleRazorpayWebhook(reqInvalid, resInvalid);
    assert(resInvalid.statusCode === 400, 'Webhook rejects invalid/tampered cryptographic signature with 400');

    // B. Acceptance of valid signature
    const reqValid = {
      headers: { 'x-razorpay-signature': validSignature },
      rawBody: Buffer.from(webhookPayload, 'utf8'),
      body: JSON.parse(webhookPayload)
    };
    const resValid = mockRes();
    await handleRazorpayWebhook(reqValid, resValid);
    assert(resValid.statusCode === 200 && resValid.data?.status === 'ok', 'Webhook accepts authentic HMAC-SHA256 signature with 200 OK');

    // -------------------------------------------------------------
    // TEST 3: Razorpay Refund System & Idempotency
    // -------------------------------------------------------------
    console.log('\nTEST SUITE 3: Razorpay Refund Engine & Idempotency');

    // Find or create a test user
    let user = await User.findOne();
    if (!user) {
      user = await User.create({
        firstName: 'Test',
        lastName: 'Auditor',
        email: `auditor_${Date.now()}@example.com`,
        passwordHash: 'SuperSecret123!',
        role: 'customer'
      });
    }

    // Create a captured online order for refund testing
    const testOrder = await Order.create({
      orderNumber: `AUDIT-${Date.now()}`,
      userId: user._id,
      items: [
        {
          productId: testProduct._id,
          name: testProduct.name,
          price: 25000,
          quantity: 1
        }
      ],
      shippingAddress: {
        fullName: 'Test Auditor',
        phone: '+91 9839116625',
        addressLine1: 'G.T. Road',
        city: 'Bhadohi',
        state: 'Uttar Pradesh',
        postalCode: '221301',
        country: 'India'
      },
      subtotal: 25000,
      total: 25000,
      paymentMethod: 'online',
      paymentStatus: 'completed',
      razorpayPaymentId: `pay_sim_audit_${Date.now()}`,
      razorpayOrderId: `order_sim_audit_${Date.now()}`,
      orderStatus: 'confirmed',
      stockRestored: false
    });

    // Stock was 5, let's decrement 1 for this order
    await decrementStockSafely([{ productId: testProduct._id, quantity: 1 }]);
    const currentStock = (await Product.findById(testProduct._id)).stock;
    assert(currentStock === 4, 'Stock decremented to 4 for the order to be refunded');

    // Process refund in simulation mode
    process.env.RAZORPAY_SIMULATION = 'true';
    const refundResult1 = await processOrderRefund({
      order: testOrder,
      reason: 'Production audit cancellation',
      initiatedBy: 'Auditor'
    });

    assert(refundResult1.success === true, 'Refund processor successfully executes refund');
    assert(testOrder.paymentStatus === 'refunded', 'Order paymentStatus updated to "refunded"');
    assert(testOrder.refundStatus === 'processed', 'Order refundStatus updated to "processed"');
    assert(testOrder.stockRestored === true, 'Order stockRestored marked true');

    const stockAfterRefund = (await Product.findById(testProduct._id)).stock;
    assert(stockAfterRefund === 5, 'Stock restored to 5 upon refund execution');

    // Duplicate Refund Prevention: Calling refund again should be idempotent
    const refundResult2 = await processOrderRefund({
      order: testOrder,
      reason: 'Duplicate retry test',
      initiatedBy: 'Auditor'
    });

    assert(refundResult2.success === true && refundResult2.alreadyRefunded === true, 'Duplicate refund attempt detected and handled idempotently');
    const stockAfterDuplicateRefund = (await Product.findById(testProduct._id)).stock;
    assert(stockAfterDuplicateRefund === 5, 'Duplicate refund attempt does NOT restore stock twice');

    // Clean up temporary test data
    await Product.findByIdAndDelete(testProduct._id);
    await Order.findByIdAndDelete(testOrder._id);

    console.log('\n================================================================');
    console.log(`  AUDIT RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('================================================================\n');

    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('[Test Execution Error]:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runAuditTests();
