import crypto from 'crypto';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix DNS for Windows SRV lookups with MongoDB Atlas
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
import { createOrder } from '../controllers/orderController.js';
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

async function runSizeSpecificDetailsSuite() {
  console.log('========================================================================');
  console.log('  HOUSE OF LOOM & CRAFT — SIZE-SPECIFIC DETAILS VERIFICATION SUITE');
  console.log('========================================================================\n');

  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.error('MONGODB_URI not found in environment.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoURI);
    console.log('[Connected to Database successfully]\n');
  } catch (err) {
    console.error('[Database Connection Failed]:', err.message);
    process.exit(1);
  }

  const testSuffix = Date.now().toString(36);
  let createdProductId = null;
  let legacyProductId = null;
  let testUserId = null;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Admin Create Product with 3 Sizes having distinct details & timings
    // -------------------------------------------------------------------------
    console.log('--- TEST 1: Admin Create Product with 3 Sizes & Distinct Timings ---');

    const adminUser = { id: new mongoose.Types.ObjectId().toString(), role: 'admin' };
    const createReq = {
      user: adminUser,
      body: {
        name: `Heritage Silk Rug ${testSuffix}`,
        slug: `heritage-silk-rug-${testSuffix}`,
        category: 'Hand Knotted Rugs',
        description: 'Finest hand-knotted mulberry silk from master weavers in Bhadohi.',
        image: '/images/hero-rug.jpg',
        material: 'Mulberry Silk on Cotton Warp',
        knotDensity: '450 KPSI',
        origin: 'Bhadohi, Uttar Pradesh, India',
        hasVariants: true,
        price: 24000,
        stock: 15,
        dispatchTime: '2-3 Business Days',
        leadTime: '5-7 Business Days',
        variants: [
          {
            id: `var_4x6_${testSuffix}`,
            size: '4 × 6 ft',
            sku: `HLC-SILK-4X6-${testSuffix.toUpperCase()}`,
            price: 18000,
            compareAtPrice: 22000,
            stock: 6,
            length: 182,
            width: 122,
            unit: 'cm',
            dimensions: '4 × 6 ft (122 × 182 cm)',
            dispatchTime: '24-48 Hours',
            leadTime: '3-5 Business Days',
            weaveTime: 'Ready in Stock',
            isDefault: false,
            active: true
          },
          {
            id: `var_5x8_${testSuffix}`,
            size: '5 × 8 ft',
            sku: `HLC-SILK-5X8-${testSuffix.toUpperCase()}`,
            price: 28000,
            compareAtPrice: 34000,
            stock: 4,
            length: 244,
            width: 152,
            unit: 'cm',
            dimensions: '5 × 8 ft (152 × 244 cm)',
            dispatchTime: '3-4 Business Days',
            leadTime: '6-8 Business Days',
            weaveTime: '2-3 Weeks Atelier Loom',
            isDefault: true,
            active: true
          },
          {
            id: `var_8x10_${testSuffix}`,
            size: '8 × 10 ft',
            sku: `HLC-SILK-8X10-${testSuffix.toUpperCase()}`,
            price: 52000,
            compareAtPrice: 62000,
            stock: 2,
            length: 305,
            width: 244,
            unit: 'cm',
            dimensions: '8 × 10 ft (244 × 305 cm)',
            dispatchTime: '5-7 Business Days',
            leadTime: '10-14 Business Days',
            weaveTime: '6-8 Weeks Master Artisan Weave',
            isDefault: false,
            active: true
          }
        ]
      }
    };

    const createRes = mockRes();
    await createProductAdmin(createReq, createRes);

    assert(createRes.statusCode === 201, 'Product created successfully via createProductAdmin (HTTP 201)');
    const createdProduct = createRes.data?.product;
    createdProductId = createdProduct?._id;
    assert(createdProduct && createdProduct.hasVariants === true, 'Product hasVariants is true');
    assert(createdProduct.variants?.length === 3, 'Product has exactly 3 size variants');

    // Verify all 3 sizes preserved their specific dimensions & timings
    const v1 = createdProduct.variants[0];
    const v2 = createdProduct.variants[1];
    const v3 = createdProduct.variants[2];

    assert(v1.size === '4 × 6 ft' && v1.sku?.includes('4X6'), 'Size 1 size & SKU saved correctly');
    assert(v1.length === 182 && v1.width === 122 && v1.unit === 'cm', 'Size 1 dimensions length/width/unit saved');
    assert(v1.dispatchTime === '24-48 Hours' && v1.leadTime === '3-5 Business Days' && v1.weaveTime === 'Ready in Stock', 'Size 1 dispatch, lead, and weave times saved');

    assert(v2.size === '5 × 8 ft' && v2.isDefault === true, 'Size 2 isDefault saved correctly');
    assert(v2.dispatchTime === '3-4 Business Days' && v2.leadTime === '6-8 Business Days' && v2.weaveTime === '2-3 Weeks Atelier Loom', 'Size 2 distinct timings saved');

    assert(v3.size === '8 × 10 ft' && v3.dispatchTime === '5-7 Business Days' && v3.weaveTime === '6-8 Weeks Master Artisan Weave', 'Size 3 distinct timings saved');

    // -------------------------------------------------------------------------
    // TEST 2: Admin Edit Product & Reload Values
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 2: Admin Edit & Reload Size Variation Values ---');

    const updateReq = {
      params: { id: createdProductId.toString() },
      user: adminUser,
      body: {
        ...createReq.body,
        name: `Heritage Silk Rug (Updated) ${testSuffix}`,
        variants: [
          {
            ...v1.toObject(),
            dispatchTime: 'Same Day Dispatch',
            leadTime: '2 Business Days',
            price: 19500
          },
          {
            ...v2.toObject(),
            dimensions: '5 × 8 ft Custom Edged',
            dispatchTime: '2-3 Days',
            leadTime: '5-7 Days'
          },
          {
            ...v3.toObject(),
            weaveTime: 'Custom Weave on Demand'
          }
        ]
      }
    };

    const updateRes = mockRes();
    await updateProductAdmin(updateReq, updateRes);

    assert(updateRes.statusCode === 200, 'Product updated successfully via updateProductAdmin (HTTP 200)');
    
    // Reload directly from DB to verify persistence
    const reloaded = await Product.findById(createdProductId);
    assert(reloaded !== null, 'Product reloaded from database');
    const relV1 = reloaded.variants.find(v => v.size === '4 × 6 ft');
    const relV2 = reloaded.variants.find(v => v.size === '5 × 8 ft');
    const relV3 = reloaded.variants.find(v => v.size === '8 × 10 ft');

    assert(relV1.dispatchTime === 'Same Day Dispatch' && relV1.leadTime === '2 Business Days' && relV1.price === 19500, 'Size 1 updated timings & price persisted');
    assert(relV2.dimensions === '5 × 8 ft Custom Edged' && relV2.dispatchTime === '2-3 Days', 'Size 2 updated dimensions & dispatch time persisted');
    assert(relV3.weaveTime === 'Custom Weave on Demand', 'Size 3 updated weaveTime persisted');

    // -------------------------------------------------------------------------
    // TEST 3: Storefront Isolation & Missing Timing Fallbacks
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3: Storefront Selection Isolation & Legacy Fallbacks ---');

    // Test Size 1 selected:
    const size1Details = {
      dimensions: relV1.dimensions,
      dispatchTime: relV1.dispatchTime || 'Not specified',
      leadTime: relV1.leadTime || 'Not specified',
      weaveTime: relV1.weaveTime || 'Not specified'
    };
    // Test Size 2 selected:
    const size2Details = {
      dimensions: relV2.dimensions,
      dispatchTime: relV2.dispatchTime || 'Not specified',
      leadTime: relV2.leadTime || 'Not specified',
      weaveTime: relV2.weaveTime || 'Not specified'
    };

    assert(size1Details.dispatchTime !== size2Details.dispatchTime, 'Size 1 and Size 2 have strictly separated dispatch times');
    assert(size1Details.leadTime !== size2Details.leadTime, 'Size 1 and Size 2 have strictly separated lead times');
    assert(size1Details.dimensions !== size2Details.dimensions, 'Size 1 and Size 2 have strictly separated dimensions');

    // Legacy product without timing:
    const legacyProd = new Product({
      name: `Vintage Wool Kilin ${testSuffix}`,
      slug: `vintage-wool-kilin-${testSuffix}`,
      category: 'Flatweave Rugs',
      collection: 'Heritage',
      description: 'Authentic handcrafted legacy piece.',
      price: 12000,
      stock: 5,
      hasVariants: false,
      dimensions: '4 × 6 ft'
      // dispatchTime, leadTime, weaveTime omitted deliberately
    });
    await legacyProd.save();
    legacyProductId = legacyProd._id;

    const legacyTimingFallback = {
      dispatchTime: legacyProd.dispatchTime || 'Not specified',
      leadTime: legacyProd.leadTime || 'Not specified',
      weaveTime: legacyProd.weaveTime || 'Not specified'
    };

    assert(legacyTimingFallback.dispatchTime === 'Not specified', 'Legacy product missing dispatchTime displays "Not specified"');
    assert(legacyTimingFallback.leadTime === 'Not specified', 'Legacy product missing leadTime displays "Not specified"');
    assert(legacyTimingFallback.weaveTime === 'Not specified', 'Legacy product missing weaveTime displays "Not specified"');

    // -------------------------------------------------------------------------
    // TEST 4: Cart and Order Snapshot Integrity
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: Cart Population & Immutable Order Snapshots ---');

    const testUser = new User({
      firstName: 'Snapshot',
      lastName: `Tester ${testSuffix}`,
      email: `snapshot_${testSuffix}@example.com`,
      passwordHash: 'dummyhash123',
      role: 'customer'
    });
    await testUser.save();
    testUserId = testUser._id;

    // Add Size 2 (5x8 ft) to cart
    const addCartReq = {
      user: { _id: testUserId, id: testUserId.toString() },
      body: {
        productId: createdProductId.toString(),
        quantity: 1,
        variantId: relV2.id,
        size: relV2.size,
        price: relV2.price
      }
    };
    const addCartRes = mockRes();
    await addToCart(addCartReq, addCartRes, (err) => { if (err) throw err; });

    assert(addCartRes.statusCode === 200, 'Variation added to cart successfully');
    const cartItem = addCartRes.data?.cart?.items?.[0];
    assert(cartItem && cartItem.size === '5 × 8 ft', 'Cart item size matches variant');
    assert(cartItem.dispatchTime === relV2.dispatchTime, 'Cart item snapshot preserves dispatchTime');
    assert(cartItem.leadTime === relV2.leadTime, 'Cart item snapshot preserves leadTime');
    assert(cartItem.weaveTime === relV2.weaveTime, 'Cart item snapshot preserves weaveTime');

    // Create Order with Size 2
    const orderReq = {
      user: { _id: testUserId, id: testUserId.toString() },
      body: {
        items: [
          {
            productId: createdProductId.toString(),
            quantity: 1,
            variantId: relV2.id,
            size: relV2.size
          }
        ],
        paymentMethod: 'cod',
        shippingAddress: {
          fullName: 'Jane Weaver',
          phone: '+91 9876543210',
          addressLine1: 'Loom Workshop Road',
          city: 'Bhadohi',
          state: 'Uttar Pradesh',
          postalCode: '221401',
          country: 'India'
        }
      }
    };
    const orderRes = mockRes();
    await createOrder(orderReq, orderRes, (err) => { if (err) throw err; });

    assert(orderRes.statusCode === 201, 'Order created successfully (HTTP 201)');
    const createdOrder = orderRes.data?.order;
    const orderItem = createdOrder?.items?.[0];

    assert(orderItem && orderItem.size === '5 × 8 ft', 'Order item has size snapshot');
    assert(orderItem.dimensions === relV2.dimensions, 'Order item has dimensions snapshot');
    assert(orderItem.dispatchTime === relV2.dispatchTime, 'Order item has dispatchTime snapshot');
    assert(orderItem.leadTime === relV2.leadTime, 'Order item has leadTime snapshot');
    assert(orderItem.weaveTime === relV2.weaveTime, 'Order item has weaveTime snapshot');
    assert(orderItem.sku === relV2.sku, 'Order item has sku snapshot');

    // -------------------------------------------------------------------------
    // TEST 5: Subsequent Product Edits Do NOT Mutate Existing Order Snapshot
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: Verify Order Snapshot Immutability After Product Edits ---');

    // Admin updates product again: change Size 2 dispatch time to "4-6 Weeks" and price to 99999
    await Product.updateOne(
      { _id: createdProductId, 'variants.id': relV2.id },
      {
        $set: {
          'variants.$.dispatchTime': '4-6 Weeks Backordered',
          'variants.$.leadTime': '8 Weeks',
          'variants.$.dimensions': 'Completely Altered Dimensions',
          'variants.$.price': 99999
        }
      }
    );

    // Retrieve order again from database
    const fetchedOrder = await Order.findById(createdOrder._id);
    const immutableItem = fetchedOrder.items[0];

    assert(immutableItem.dispatchTime === '2-3 Days', 'Order snapshot dispatchTime remains untouched by later product edits');
    assert(immutableItem.leadTime === '5-7 Days', 'Order snapshot leadTime remains untouched by later product edits');
    assert(immutableItem.dimensions === '5 × 8 ft Custom Edged', 'Order snapshot dimensions remains untouched by later product edits');
    assert(immutableItem.price === 28000, 'Order snapshot price remains historical price');

  } catch (err) {
    console.error('Test error:', err);
    failed++;
  } finally {
    // Cleanup test records
    console.log('\n--- Cleanup Test Records ---');
    try {
      if (createdProductId) await Product.findByIdAndDelete(createdProductId);
      if (legacyProductId) await Product.findByIdAndDelete(legacyProductId);
      if (testUserId) {
        await User.findByIdAndDelete(testUserId);
        await Order.deleteMany({ userId: testUserId });
        await Cart.deleteMany({ userId: testUserId });
      }
      console.log('Test records cleaned up successfully.');
    } catch (cleanErr) {
      console.error('Cleanup warning:', cleanErr.message);
    }

    await mongoose.disconnect();
    console.log('\n========================================================================');
    console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  }
}

runSizeSpecificDetailsSuite();
