import crypto from 'crypto';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve DNS for Windows SRV lookups with MongoDB Atlas
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
import { Cart } from '../models/Cart.js';
import { User } from '../models/User.js';
import { decrementStockSafely, restoreOrderStockSafely, createOrder } from '../controllers/orderController.js';
import { createRazorpayOrder, verifyPaymentAndCreateOrder } from '../controllers/paymentController.js';
import { createProductAdmin, updateProductAdmin } from '../controllers/adminController.js';
import { addToCart, buildAuthoritativeCart } from '../controllers/cartController.js';

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

async function runVariantTestSuite() {
  console.log('================================================================');
  console.log('  HOUSE OF LOOM & CRAFT — SIZE-WISE PRICING & VARIANTS TEST SUITE');
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

  const testSuffix = Date.now().toString(36);
  let testProductWithVariants = null;
  let testLegacyProduct = null;
  let testUser = null;

  try {
    // -------------------------------------------------------------
    // SECTION 1: Product Data Model & Variant Validation
    // -------------------------------------------------------------
    console.log('--- SECTION 1: Product Data Model & Schema Validation ---');

    // 1.1 Create product with multiple size variants
    const validVariants = [
      { id: `var_4x6_${testSuffix}`, size: '4 × 6 ft', price: 18000, compareAtPrice: 22000, stock: 5, active: true, isDefault: false },
      { id: `var_5x8_${testSuffix}`, size: '5 × 8 ft', price: 26000, compareAtPrice: 32000, stock: 8, active: true, isDefault: true },
      { id: `var_8x10_${testSuffix}`, size: '8 × 10 ft', price: 48000, compareAtPrice: 58000, stock: 3, active: true, isDefault: false },
      { id: `var_9x12_${testSuffix}`, size: '9 × 12 ft', price: 65000, compareAtPrice: 75000, stock: 0, active: false, isDefault: false }
    ];

    testProductWithVariants = new Product({
      name: `Imperial Kashan Silk Rug - ${testSuffix}`,
      slug: `imperial-kashan-silk-rug-${testSuffix}`,
      category: 'Hand Knotted Rugs',
      collectionName: 'Hand Knotted Rugs',
      collection: 'hand-knotted',
      price: 18000,
      stock: 16,
      hasVariants: true,
      variants: validVariants,
      material: '100% Silk on Cotton',
      description: 'Masterpiece artisan carpet with botanical medallion motifs.',
      thumbnail: '/images/carpets/dune-saffron.jpg',
      images: ['/images/carpets/dune-saffron.jpg']
    });

    await testProductWithVariants.save();
    assert(testProductWithVariants._id && testProductWithVariants.variants.length === 4, 'Saved product with 4 size variants successfully');
    assert(testProductWithVariants.price === 18000, 'Base price auto-aligned with minimum active variant price (18,000)');

    // 1.2 Reject duplicate size entries
    let duplicateSizeError = null;
    try {
      const duplicateProduct = new Product({
        name: `Duplicate Size Rug - ${testSuffix}`,
        slug: `dup-size-${testSuffix}`,
        category: 'Hand Knotted Rugs',
        collection: 'hand-knotted',
        price: 20000,
        stock: 10,
        hasVariants: true,
        variants: [
          { id: `var_1_${testSuffix}`, size: '5 × 8 ft', price: 20000, active: true },
          { id: `var_2_${testSuffix}`, size: '5 × 8 ft', price: 25000, active: true } // Duplicate size!
        ],
        description: 'Test rug',
        thumbnail: '/images/test.jpg'
      });
      await duplicateProduct.save();
    } catch (err) {
      duplicateSizeError = err;
    }
    assert(duplicateSizeError && (duplicateSizeError.message.includes('Duplicate variant size') || duplicateSizeError.message.includes('unique')), 'Rejected product with duplicate variant sizes');

    // 1.3 Reject negative prices
    let negativePriceError = null;
    try {
      const negativeProduct = new Product({
        name: `Negative Price Rug - ${testSuffix}`,
        slug: `neg-price-${testSuffix}`,
        category: 'Hand Knotted Rugs',
        collection: 'hand-knotted',
        price: 20000,
        stock: 10,
        hasVariants: true,
        variants: [
          { id: `var_neg_${testSuffix}`, size: '6 × 9 ft', price: -5000, active: true }
        ],
        description: 'Test rug',
        thumbnail: '/images/test.jpg'
      });
      await negativeProduct.save();
    } catch (err) {
      negativePriceError = err;
    }
    assert(negativePriceError && (negativePriceError.message.includes('finite, non-negative') || negativePriceError.message.includes('minimum')), 'Rejected variant with negative price');

    // 1.4 Reject multiple default selections
    let multiDefaultError = null;
    try {
      const multiDefaultProduct = new Product({
        name: `Multi Default Rug - ${testSuffix}`,
        slug: `multi-def-${testSuffix}`,
        category: 'Hand Knotted Rugs',
        collection: 'hand-knotted',
        price: 20000,
        stock: 10,
        hasVariants: true,
        variants: [
          { id: `var_d1_${testSuffix}`, size: '4 × 6 ft', price: 15000, active: true, isDefault: true },
          { id: `var_d2_${testSuffix}`, size: '6 × 9 ft', price: 25000, active: true, isDefault: true }
        ],
        description: 'Test rug',
        thumbnail: '/images/test.jpg'
      });
      await multiDefaultProduct.save();
    } catch (err) {
      multiDefaultError = err;
    }
    assert(multiDefaultError && multiDefaultError.message.includes('Only one variant can be marked as default'), 'Rejected product with multiple default variants');

    // 1.5 Legacy Product Compatibility (no variants)
    testLegacyProduct = new Product({
      name: `Legacy Architectural Urn - ${testSuffix}`,
      slug: `legacy-urn-${testSuffix}`,
      category: 'Home Decor',
      collection: 'home-decor',
      price: 14500,
      stock: 7,
      hasVariants: false,
      variants: [],
      dimensions: '18 x 18 x 24 inches',
      description: 'Hand-carved sandstone decor accent.',
      thumbnail: '/images/decor/urn.jpg'
    });
    await testLegacyProduct.save();
    assert(testLegacyProduct._id && testLegacyProduct.hasVariants === false, 'Legacy product without variants saved and works seamlessly');

    // -------------------------------------------------------------
    // SECTION 2: Admin Controller Updates & Price Management
    // -------------------------------------------------------------
    console.log('\n--- SECTION 2: Admin Controller Variant Management ---');

    // 2.1 Update variants via Admin Controller
    const updateReq = {
      params: { id: testProductWithVariants._id.toString() },
      body: {
        name: `Imperial Kashan Silk Rug (Updated) - ${testSuffix}`,
        hasVariants: true,
        variants: [
          { id: `var_4x6_${testSuffix}`, size: '4 × 6 ft', price: 19500, compareAtPrice: 24000, stock: 6, active: true, isDefault: false },
          { id: `var_5x8_${testSuffix}`, size: '5 × 8 ft', price: 27500, compareAtPrice: 34000, stock: 7, active: true, isDefault: true },
          { id: `var_8x10_${testSuffix}`, size: '8 × 10 ft', price: 49000, compareAtPrice: 60000, stock: 4, active: true, isDefault: false },
          { id: `var_9x12_${testSuffix}`, size: '9 × 12 ft', price: 68000, compareAtPrice: 78000, stock: 2, active: true, isDefault: false } // Re-activated
        ]
      }
    };
    const updateRes = mockRes();
    await updateProductAdmin(updateReq, updateRes);

    assert(updateRes.statusCode === 200 && updateRes.data.success, 'Admin updateProductAdmin responded with 200 OK');
    const reloadedProduct = await Product.findById(testProductWithVariants._id);
    const updated4x6 = reloadedProduct.variants.find(v => v.size === '4 × 6 ft');
    assert(updated4x6 && updated4x6.price === 19500, 'Variant 4 × 6 ft price successfully updated to 19,500');
    assert(reloadedProduct.price === 19500, 'Product base price recalculated to new minimum active variant price (19,500)');

    // -------------------------------------------------------------
    // SECTION 3: Cart Representation & Variant Isolation
    // -------------------------------------------------------------
    console.log('\n--- SECTION 3: Cart Operations & Multi-Variant Differentiation ---');

    // Create a temporary test user
    testUser = new User({
      firstName: 'Tester',
      lastName: 'Auditor',
      email: `test_${testSuffix}@houseofloomcraft.internal`,
      passwordHash: 'dummyhash',
      role: 'customer'
    });
    await testUser.save();

    // 3.1 Add 5 × 8 ft variant to Cart
    const addCartReq1 = {
      user: { _id: testUser._id },
      body: {
        productId: testProductWithVariants._id.toString(),
        variantId: `var_5x8_${testSuffix}`,
        size: '5 × 8 ft',
        quantity: 1
      }
    };
    const addCartRes1 = mockRes();
    await addToCart(addCartReq1, addCartRes1);
    assert(addCartRes1.statusCode === 200 && addCartRes1.data.success, 'Added 5 × 8 ft variant to user cart');

    // 3.2 Add 4 × 6 ft variant of the SAME product to Cart
    const addCartReq2 = {
      user: { _id: testUser._id },
      body: {
        productId: testProductWithVariants._id.toString(),
        variantId: `var_4x6_${testSuffix}`,
        size: '4 × 6 ft',
        quantity: 2
      }
    };
    const addCartRes2 = mockRes();
    await addToCart(addCartReq2, addCartRes2);
    assert(addCartRes2.statusCode === 200 && addCartRes2.data.success, 'Added 4 × 6 ft variant of same product to user cart');

    // 3.3 Verify Cart has 2 distinct line items with distinct authoritative prices
    const userCart = await Cart.findOne({ userId: testUser._id });
    assert(userCart && userCart.items.length === 2, 'Cart maintains 2 distinct items for different sizes of the same product');
    
    const authoritativeCart = await buildAuthoritativeCart(userCart);
    assert(authoritativeCart.items.length === 2, 'Authoritative cart resolved 2 items');
    
    const cartItem5x8 = authoritativeCart.items.find(i => i.size === '5 × 8 ft');
    const cartItem4x6 = authoritativeCart.items.find(i => i.size === '4 × 6 ft');
    assert(cartItem5x8 && cartItem5x8.price === 27500, '5 × 8 ft cart item unit price resolved authoritatively to 27,500');
    assert(cartItem4x6 && cartItem4x6.price === 19500, '4 × 6 ft cart item unit price resolved authoritatively to 19,500');
    assert(authoritativeCart.subtotal === 27500 * 1 + 19500 * 2, 'Authoritative subtotal matches exact formula (27500*1 + 19500*2 = 66,500)');

    // -------------------------------------------------------------
    // SECTION 4: Price Tampering Prevention & Checkout Security
    // -------------------------------------------------------------
    console.log('\n--- SECTION 4: Price Tampering Prevention & Server Authority ---');

    // Client maliciously attempts to order 5 × 8 ft with price = ₹1.00
    const tamperedOrderReq = {
      user: { _id: testUser._id },
      body: {
        items: [
          {
            productId: testProductWithVariants._id.toString(),
            variantId: `var_5x8_${testSuffix}`,
            size: '5 × 8 ft',
            price: 1, // MALICIOUS CLIENT TAMPERING
            quantity: 1
          }
        ],
        shippingAddress: {
          fullName: 'Security Auditor',
          phone: '+919876543210',
          addressLine1: 'Audit Tower, Floor 4',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'India'
        },
        paymentMethod: 'cod',
        currency: 'INR'
      }
    };

    const tamperedOrderRes = mockRes();
    await createOrder(tamperedOrderReq, tamperedOrderRes);

    assert(tamperedOrderRes.statusCode === 201 && tamperedOrderRes.data.success, 'Order created successfully');
    const createdOrder = tamperedOrderRes.data.order;
    assert(createdOrder.items[0].price === 27500, 'CRITICAL SECURITY: Server completely rejected client price (1) and charged authoritative price (27,500)');
    assert(createdOrder.subtotal === 27500, 'CRITICAL SECURITY: Order subtotal is 27,500, not 1');
    assert(createdOrder.items[0].variantId === `var_5x8_${testSuffix}`, 'Order item preserved variant ID');
    assert(createdOrder.items[0].size === '5 × 8 ft', 'Order item preserved size label');

    // -------------------------------------------------------------
    // SECTION 5: Inactive Variant Protection
    // -------------------------------------------------------------
    console.log('\n--- SECTION 5: Inactive Variant Protection ---');

    // Deactivate 9 × 12 ft variant
    await Product.updateOne(
      { _id: testProductWithVariants._id, 'variants.size': '9 × 12 ft' },
      { $set: { 'variants.$.active': false } }
    );

    const inactiveCheckoutReq = {
      user: { _id: testUser._id },
      body: {
        items: [
          {
            productId: testProductWithVariants._id.toString(),
            variantId: `var_9x12_${testSuffix}`,
            size: '9 × 12 ft',
            quantity: 1
          }
        ],
        shippingAddress: {
          fullName: 'Security Auditor',
          phone: '+919876543210',
          addressLine1: 'Audit Tower',
          city: 'Mumbai',
          postalCode: '400001'
        },
        paymentMethod: 'cod'
      }
    };
    const inactiveCheckoutRes = mockRes();
    await createOrder(inactiveCheckoutReq, inactiveCheckoutRes);
    assert(inactiveCheckoutRes.statusCode === 400 && (inactiveCheckoutRes.data.message.includes('unavailable') || inactiveCheckoutRes.data.message.includes('inactive')), 'Rejected checkout attempt on inactive size variant');

    // -------------------------------------------------------------
    // SECTION 6: Razorpay Online Order Server Pricing Validation
    // -------------------------------------------------------------
    console.log('\n--- SECTION 6: Razorpay Payment Pricing Verification ---');

    const razorpayReq = {
      body: {
        items: [
          {
            productId: testProductWithVariants._id.toString(),
            variantId: `var_8x10_${testSuffix}`,
            size: '8 × 10 ft',
            price: 99, // CLIENT PRICE TAMPERING ATTEMPT
            quantity: 1
          }
        ],
        currency: 'INR'
      }
    };
    const razorpayRes = mockRes();
    await createRazorpayOrder(razorpayReq, razorpayRes);

    assert(razorpayRes.statusCode === 200 && razorpayRes.data.success, 'createRazorpayOrder responded with 200 OK');
    // 8x10 ft variant price is 49,000 INR = 4900000 paise
    assert(razorpayRes.data.amount === 4900000, 'Razorpay order amount in paise is strictly 4,900,000 paise (₹49,000), ignoring client-sent 99');

    // -------------------------------------------------------------
    // SECTION 7: Stock Decrement & Atomic Rollback
    // -------------------------------------------------------------
    console.log('\n--- SECTION 7: Variant-Level Stock Decrement & Atomic Rollback ---');

    // Variant 8 × 10 ft currently has stock = 4
    const initialProductState = await Product.findById(testProductWithVariants._id);
    const initial8x10Stock = initialProductState.variants.find(v => v.size === '8 × 10 ft').stock;

    // Successful decrement of 2 units
    const stockDecRes = await decrementStockSafely([
      {
        productId: testProductWithVariants._id.toString(),
        variantId: `var_8x10_${testSuffix}`,
        size: '8 × 10 ft',
        quantity: 2
      }
    ]);
    assert(stockDecRes.success, 'Successfully decremented 2 units of 8 × 10 ft variant stock');

    const updatedAfterDec = await Product.findById(testProductWithVariants._id);
    const postDec8x10Stock = updatedAfterDec.variants.find(v => v.size === '8 × 10 ft').stock;
    assert(postDec8x10Stock === initial8x10Stock - 2, `Variant stock correctly reduced from ${initial8x10Stock} to ${postDec8x10Stock}`);

    // Failed attempt to oversell (attempting 10 units when only 2 remain)
    const oversellRes = await decrementStockSafely([
      {
        productId: testProductWithVariants._id.toString(),
        variantId: `var_8x10_${testSuffix}`,
        size: '8 × 10 ft',
        quantity: 10
      }
    ]);
    assert(!oversellRes.success, 'Oversell attempt correctly rejected with failure');

    const stockAfterOversell = await Product.findById(testProductWithVariants._id);
    const final8x10Stock = stockAfterOversell.variants.find(v => v.size === '8 × 10 ft').stock;
    assert(final8x10Stock === postDec8x10Stock, 'Atomic rollback guaranteed: Stock remained unchanged after rejected oversell attempt');

    // Restore stock
    await restoreOrderStockSafely([
      {
        product: testProductWithVariants._id.toString(),
        variantId: `var_8x10_${testSuffix}`,
        size: '8 × 10 ft',
        quantity: 2
      }
    ]);
    const restoredProduct = await Product.findById(testProductWithVariants._id);
    const restored8x10Stock = restoredProduct.variants.find(v => v.size === '8 × 10 ft').stock;
    assert(restored8x10Stock === initial8x10Stock, 'Stock successfully restored back to initial value upon order cancellation');

    // -------------------------------------------------------------
    // SECTION 8: Historical Order Pricing Preservation
    // -------------------------------------------------------------
    console.log('\n--- SECTION 8: Historical Order Pricing Immutability ---');

    // Change variant 5 × 8 ft price in catalog from 27,500 to 35,000
    await Product.updateOne(
      { _id: testProductWithVariants._id, 'variants.size': '5 × 8 ft' },
      { $set: { 'variants.$.price': 35000 } }
    );

    // Retrieve the historical order created earlier in Section 4
    const historicalOrder = await Order.findById(createdOrder._id);
    assert(historicalOrder.items[0].price === 27500, 'CRITICAL AUDIT: Historical order item price remained exactly 27,500 despite product price update');
    assert(historicalOrder.subtotal === 27500, 'Historical order total remained exactly 27,500');

  } catch (err) {
    console.error('Unexpected test error:', err);
    failed++;
  } finally {
    // Cleanup temporary test documents
    console.log('\n--- Cleaning up temporary test artifacts ---');
    if (testProductWithVariants) {
      await Product.deleteOne({ _id: testProductWithVariants._id });
    }
    if (testLegacyProduct) {
      await Product.deleteOne({ _id: testLegacyProduct._id });
    }
    if (testUser) {
      await User.deleteOne({ _id: testUser._id });
      await Cart.deleteOne({ userId: testUser._id });
      await Order.deleteMany({ userId: testUser._id });
    }
    console.log('Cleanup complete.\n');

    console.log('================================================================');
    console.log(`  RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('================================================================\n');

    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runVariantTestSuite();
