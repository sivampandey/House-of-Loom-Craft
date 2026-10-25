import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

// Resolve DNS for Windows Atlas SRV lookups
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
import { deleteProductAdmin, getAllProductsAdmin } from '../controllers/adminController.js';
import {
  extractCloudinaryPublicId,
  isCloudinaryUrl,
  getCloudinaryCloudName
} from '../config/cloudinary.js';
import {
  collectProductCloudinaryAssets,
  isAssetSharedWithOtherEntities,
  cleanupProductAssets
} from '../services/imageCleanupService.js';

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

async function runCleanupTests() {
  console.log('================================================================');
  console.log('  HOUSE OF LOOM & CRAFT — CLOUDINARY CLEANUP & DELETION SUITE');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // TEST 1: Cloudinary URL Detection & Public ID Extraction
  // -------------------------------------------------------------
  console.log('--- TEST 1: Cloudinary URL Parsing & Extraction Logic ---');

  const cloud = getCloudinaryCloudName() || 'demo';

  // 1.1 Standard versioned URL
  const url1 = `https://res.cloudinary.com/${cloud}/image/upload/v1745678901/house-of-loom/products/persian-silk-rug.jpg`;
  assert(isCloudinaryUrl(url1) === true, 'Recognizes standard Cloudinary secure URL');
  assert(extractCloudinaryPublicId(url1) === 'house-of-loom/products/persian-silk-rug', 'Extracts public_id from versioned URL');

  // 1.2 Transformed URL with version
  const url2 = `https://res.cloudinary.com/${cloud}/image/upload/c_fill,w_800,h_600/v1745678901/house-of-loom/products/antique-kashan.webp`;
  assert(extractCloudinaryPublicId(url2) === 'house-of-loom/products/antique-kashan', 'Extracts public_id from transformed URL');

  // 1.3 URL without version
  const url3 = `https://res.cloudinary.com/${cloud}/image/upload/house-of-loom/products/dune-saffron.png`;
  assert(extractCloudinaryPublicId(url3) === 'house-of-loom/products/dune-saffron', 'Extracts public_id from URL without version prefix');

  // 1.4 URL with multiple transformations and no version
  const url4 = `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto/c_scale,w_1200/house-of-loom/products/heritage-wool.jpg`;
  assert(extractCloudinaryPublicId(url4) === 'house-of-loom/products/heritage-wool', 'Extracts public_id across multiple transformation segments');

  // 1.5 Local and legacy non-Cloudinary assets (MUST NOT trigger deletion)
  const localUrl = '/images/carpets/dune-saffron.jpg';
  assert(isCloudinaryUrl(localUrl) === false, 'Rejects local image path /images/...');
  assert(extractCloudinaryPublicId(localUrl) === null, 'Extract returns null for local paths');

  // 1.6 External non-Cloudinary URL
  const unsplashUrl = 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format';
  assert(isCloudinaryUrl(unsplashUrl) === false, 'Rejects external CDN URLs (Unsplash)');
  assert(extractCloudinaryPublicId(unsplashUrl) === null, 'Extract returns null for external CDNs');

  // 1.7 URL from a DIFFERENT Cloudinary cloud name (if cloud name is configured)
  if (cloud && cloud !== 'demo') {
    const foreignCloudUrl = 'https://res.cloudinary.com/completely-different-account/image/upload/v1/sample.jpg';
    assert(isCloudinaryUrl(foreignCloudUrl) === false, 'Rejects Cloudinary URLs belonging to another account');
    assert(extractCloudinaryPublicId(foreignCloudUrl) === null, 'Returns null for foreign Cloudinary accounts');
  }

  // -------------------------------------------------------------
  // TEST 2: Product Asset Collection & Deduplication
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Product Asset Collection & Deduplication ---');

  const testProductData = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Sample Royal Medallion Carpet',
    thumbnail: `https://res.cloudinary.com/${cloud}/image/upload/v1/house-of-loom/products/royal-main.jpg`,
    images: [
      `https://res.cloudinary.com/${cloud}/image/upload/v1/house-of-loom/products/royal-main.jpg`, // Duplicate of thumbnail!
      `https://res.cloudinary.com/${cloud}/image/upload/v1/house-of-loom/products/royal-knot-density.jpg`,
      '/images/decor/urn.jpg' // Local legacy asset
    ],
    texture: `https://res.cloudinary.com/${cloud}/image/upload/v1/house-of-loom/products/royal-weave-texture.webp`,
    imageAssets: [
      {
        url: `https://res.cloudinary.com/${cloud}/image/upload/v1/house-of-loom/products/royal-main.jpg`,
        publicId: 'house-of-loom/products/royal-main'
      },
      {
        url: `https://res.cloudinary.com/${cloud}/image/upload/v1/house-of-loom/products/royal-room-styled.jpg`,
        publicId: 'house-of-loom/products/royal-room-styled'
      }
    ]
  };

  const collectedAssets = collectProductCloudinaryAssets(testProductData);
  assert(collectedAssets.length === 4, 'Deduplicates duplicate images across thumbnail, gallery, texture and imageAssets (4 distinct assets found)');
  assert(collectedAssets.some(a => a.publicId === 'house-of-loom/products/royal-main'), 'Collected royal-main publicId');
  assert(collectedAssets.some(a => a.publicId === 'house-of-loom/products/royal-knot-density'), 'Collected royal-knot-density publicId');
  assert(collectedAssets.some(a => a.publicId === 'house-of-loom/products/royal-weave-texture'), 'Collected texture publicId');
  assert(collectedAssets.some(a => a.publicId === 'house-of-loom/products/royal-room-styled'), 'Collected imageAssets publicId');
  assert(!collectedAssets.some(a => a.url.includes('/images/decor/urn.jpg')), 'Local legacy image was safely excluded');

  // Connect to MongoDB for Database Lifecycle & Shared Asset Verification
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.warn('\nMONGODB_URI not found. Skipping live database persistence tests.');
    console.log(`\n================================================================`);
    console.log(`  RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('================================================================\n');
    return;
  }

  try {
    await mongoose.connect(mongoURI);
    console.log('\n[Connected to Database successfully]\n');
  } catch (err) {
    console.error('[Database Connection Failed]:', err.message);
    return;
  }

  const testSuffix = Date.now().toString(36);
  let productA = null;
  let productB = null;
  let orderedProduct = null;
  let testUser = null;
  let testOrder = null;

  try {
    // -------------------------------------------------------------
    // TEST 3: Shared Image Protection Between Products
    // -------------------------------------------------------------
    console.log('--- TEST 3: Shared Asset Protection Protocol ---');

    const sharedAssetPublicId = `house-of-loom/products/shared-knot-${testSuffix}`;
    const sharedAssetUrl = `https://res.cloudinary.com/${cloud}/image/upload/v1/${sharedAssetPublicId}.jpg`;

    const exclusiveAssetPublicId = `house-of-loom/products/exclusive-rug-${testSuffix}`;
    const exclusiveAssetUrl = `https://res.cloudinary.com/${cloud}/image/upload/v1/${exclusiveAssetPublicId}.jpg`;

    // Create Product A (has both shared and exclusive images)
    productA = await Product.create({
      name: `Carpet A (Shared Test) - ${testSuffix}`,
      slug: `carpet-a-${testSuffix}`,
      category: 'Hand Knotted Rugs',
      collection: 'hand-knotted',
      price: 45000,
      stock: 3,
      description: 'Test rug A with shared asset.',
      thumbnail: exclusiveAssetUrl,
      images: [exclusiveAssetUrl, sharedAssetUrl],
      imageAssets: [
        { url: exclusiveAssetUrl, publicId: exclusiveAssetPublicId },
        { url: sharedAssetUrl, publicId: sharedAssetPublicId }
      ]
    });

    // Create Product B (also references sharedAssetUrl)
    productB = await Product.create({
      name: `Carpet B (Shared Test) - ${testSuffix}`,
      slug: `carpet-b-${testSuffix}`,
      category: 'Hand Knotted Rugs',
      collection: 'hand-knotted',
      price: 52000,
      stock: 4,
      description: 'Test rug B sharing image with rug A.',
      thumbnail: sharedAssetUrl,
      images: [sharedAssetUrl],
      imageAssets: [
        { url: sharedAssetUrl, publicId: sharedAssetPublicId }
      ]
    });

    assert(productA._id && productB._id, 'Created Product A and Product B in database');

    // 3.1 Verify share detection for sharedAsset
    const sharedCheck = await isAssetSharedWithOtherEntities(
      { publicId: sharedAssetPublicId, url: sharedAssetUrl },
      productA._id
    );
    assert(sharedCheck.isShared === true, 'isAssetSharedWithOtherEntities correctly flags shared photograph');
    assert(sharedCheck.sharedId === productB._id.toString(), 'Identifies Product B as the other entity using the asset');

    // 3.2 Verify exclusive asset is NOT marked shared
    const exclusiveCheck = await isAssetSharedWithOtherEntities(
      { publicId: exclusiveAssetPublicId, url: exclusiveAssetUrl },
      productA._id
    );
    assert(exclusiveCheck.isShared === false, 'Exclusive asset is correctly marked unshared');

    // 3.3 Execute cleanupProductAssets for Product A
    const cleanupReportA = await cleanupProductAssets(productA);
    assert(cleanupReportA.totalAssetsFound === 2, 'Found 2 total assets for Product A');
    assert(cleanupReportA.retainedSharedCount === 1, 'Protected and retained the 1 shared asset');
    assert(
      cleanupReportA.retainedSharedAssets.some(a => a.publicId === sharedAssetPublicId),
      'Retained asset list contains sharedAssetPublicId'
    );

    // -------------------------------------------------------------
    // TEST 4: Customer Order History Protection (Soft-Delete)
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Customer Order History Protection & Soft-Delete ---');

    // Create test user and product with an order
    testUser = await User.create({
      firstName: 'Audit',
      lastName: 'Tester',
      email: `audit_${testSuffix}@example.com`,
      passwordHash: 'dummy',
      role: 'customer'
    });

    const orderedAssetPublicId = `house-of-loom/products/ordered-rug-${testSuffix}`;
    const orderedAssetUrl = `https://res.cloudinary.com/${cloud}/image/upload/v1/${orderedAssetPublicId}.jpg`;

    orderedProduct = await Product.create({
      name: `Ordered Carpet Piece - ${testSuffix}`,
      slug: `ordered-carpet-${testSuffix}`,
      category: 'Hand Knotted Rugs',
      collection: 'hand-knotted',
      price: 38000,
      stock: 2,
      description: 'Rug that has historical customer purchase.',
      thumbnail: orderedAssetUrl,
      images: [orderedAssetUrl]
    });

    testOrder = await Order.create({
      orderNumber: `AUDIT-DEL-${testSuffix}`,
      userId: testUser._id,
      items: [
        {
          productId: orderedProduct._id,
          name: orderedProduct.name,
          price: 38000,
          quantity: 1,
          image: orderedAssetUrl
        }
      ],
      shippingAddress: {
        fullName: 'Audit Tester',
        phone: '+919876543210',
        addressLine1: 'Test Avenue',
        city: 'Varanasi',
        state: 'Uttar Pradesh',
        postalCode: '221001',
        country: 'India'
      },
      subtotal: 38000,
      total: 38000,
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      orderStatus: 'confirmed'
    });

    // Attempt deletion through admin controller
    const delReq = { params: { id: orderedProduct._id.toString() } };
    const delRes = mockRes();
    await deleteProductAdmin(delReq, delRes);

    assert(delRes.statusCode === 200, 'Delete controller responded with 200');
    assert(delRes.data?.softDeleted === true, 'Recognized historical order and executed safe soft-delete (isActive=false)');
    assert(delRes.data?.productId === orderedProduct._id.toString(), 'Response returned productId for frontend state synchronization');
    assert(delRes.data?.orderNumber === testOrder.orderNumber, 'Response returned orderNumber explaining reason for archiving');
    assert(delRes.data?.cleanup?.skipped === true, 'Skipped Cloudinary deletion to preserve customer order invoice photograph');

    const softDeletedCheck = await Product.findById(orderedProduct._id);
    assert(softDeletedCheck !== null && softDeletedCheck.isActive === false, 'Product remains in DB as inactive (unpublished) without breaking order history');
    assert(softDeletedCheck.isArchived === true, 'Product is marked isArchived: true');
    assert(softDeletedCheck.archiveReason.includes(testOrder.orderNumber), 'Product archiveReason contains reference to order number');

    // -------------------------------------------------------------
    // TEST 5: Permanent Deletion & Cleanup Response Protocol
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Permanent Deletion & API Response Protocol ---');

    // Delete Product B (now Product A is not in active use)
    // First remove Product A from DB to simulate permanent deletion
    await Product.findByIdAndDelete(productA._id);

    const delReqB = { params: { id: productB._id.toString() } };
    const delResB = mockRes();
    await deleteProductAdmin(delReqB, delResB);

    assert(delResB.statusCode === 200 && delResB.data?.success === true, 'Admin deleteProductAdmin responded 200 for unreferenced product');
    assert(delResB.data?.softDeleted === false, 'Marked softDeleted: false (permanently removed)');
    assert(delResB.data?.productId === productB._id.toString(), 'Response contains deleted productId');
    assert(typeof delResB.data?.cleanup?.totalAssets === 'number', 'Response contains cleanup statistics');

    const productBCheck = await Product.findById(productB._id);
    assert(productBCheck === null, 'Product B completely removed from MongoDB');

    // -------------------------------------------------------------
    // TEST 6: Backend Deletion Validation & Catalog Status Filtering
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Error Handling & Catalog Status Filtering ---');

    // 6.1 Invalid product ID
    const badIdRes = mockRes();
    await deleteProductAdmin({ params: { id: 'invalid-id' } }, badIdRes);
    assert(badIdRes.statusCode === 400 && badIdRes.data?.success === false, 'Rejects invalid product ObjectId with 400');

    // 6.2 Non-existent product ID
    const notFoundRes = mockRes();
    await deleteProductAdmin({ params: { id: '000000000000000000000000' } }, notFoundRes);
    if (notFoundRes.statusCode !== 404) {
      console.log('DEBUG notFoundRes:', notFoundRes.statusCode, notFoundRes.data);
    }
    assert(notFoundRes.statusCode === 404 && notFoundRes.data?.success === false, 'Returns 404 for non-existent product');

    // 6.3 Catalog status filtering for active items excludes archived product
    const activeReq = { query: { status: 'active', search: testSuffix } };
    const activeRes = mockRes();
    await getAllProductsAdmin(activeReq, activeRes);
    const activeList = activeRes.data?.products || [];
    assert(activeList.every(p => p._id.toString() !== orderedProduct._id.toString()), 'Active products filter strictly excludes archived product');

    // 6.4 Catalog status filtering for archived items includes archived product
    const archivedReq = { query: { status: 'archived', search: testSuffix } };
    const archivedRes = mockRes();
    await getAllProductsAdmin(archivedReq, archivedRes);
    const archivedList = archivedRes.data?.products || [];
    assert(archivedList.some(p => p._id.toString() === orderedProduct._id.toString()), 'Archived products filter returns archived product with isArchived: true');

    // 6.5 Catalog status filtering for all items returns archived product with isArchived flag
    const allReq = { query: { status: 'all', search: testSuffix } };
    const allRes = mockRes();
    await getAllProductsAdmin(allReq, allRes);
    const allList = allRes.data?.products || [];
    const foundInAll = allList.find(p => p._id.toString() === orderedProduct._id.toString());
    assert(foundInAll !== undefined && foundInAll.isArchived === true && foundInAll.isActive === false, 'All products filter returns archived item clearly flagged with isArchived: true');

    // 6.6 Catalog hideArchived filter removes archived items from view
    const hideArchivedReq = { query: { status: 'all', search: testSuffix, hideArchived: 'true' } };
    const hideArchivedRes = mockRes();
    await getAllProductsAdmin(hideArchivedReq, hideArchivedRes);
    const hideArchivedList = hideArchivedRes.data?.products || [];
    assert(hideArchivedList.every(p => p._id.toString() !== orderedProduct._id.toString()), 'Hide Archived view control successfully filters out archived products from the current list');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    // Cleanup temporary documents
    console.log('\n[Cleaning up temporary test database artifacts]');
    if (productA?._id) await Product.findByIdAndDelete(productA._id);
    if (productB?._id) await Product.findByIdAndDelete(productB._id);
    if (orderedProduct?._id) await Product.findByIdAndDelete(orderedProduct._id);
    if (testOrder?._id) await Order.findByIdAndDelete(testOrder._id);
    if (testUser?._id) await User.findByIdAndDelete(testUser._id);

    await mongoose.disconnect();
    console.log('\n================================================================');
    console.log(`  RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  }
}

runCleanupTests();
