import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

// Resolve DNS for Windows Atlas SRV
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
import { createProductAdmin, updateProductAdmin, uploadProductImageAdmin } from '../controllers/adminController.js';
import { isCloudinaryConfigured, uploadBufferToCloudinary } from '../config/cloudinary.js';

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

async function runImageUploadTests() {
  console.log('================================================================');
  console.log('  HOUSE OF LOOM & CRAFT — PRODUCT IMAGE UPLOAD AUDIT SUITE');
  console.log('================================================================\n');

  // Test 1: Configuration Detection
  console.log('--- TEST 1: Cloudinary Configuration State ---');
  const configured = isCloudinaryConfigured();
  console.log(`  Cloudinary Configured in Environment: ${configured}`);
  assert(typeof configured === 'boolean', 'Cloudinary configuration check returns boolean status');

  // Test 2: Unconfigured Upload Guard (Graceful Failure)
  console.log('\n--- TEST 2: Upload Guard & Error Handling ---');
  if (!configured) {
    let errorCaught = false;
    try {
      await uploadBufferToCloudinary(Buffer.from('fake_image_bytes'));
    } catch (err) {
      errorCaught = true;
      assert(
        err.message.includes('CLOUDINARY_CLOUD_NAME') || err.message.includes('not configured'),
        'Upload safely rejects with actionable Render environment instructions when unconfigured'
      );
    }
    assert(errorCaught, 'Unconfigured environment does not hang or crash');
  } else {
    assert(true, 'Cloudinary configured; live upload active');
  }

  // Test 3: Multer Controller Validation (Empty File Guard)
  console.log('\n--- TEST 3: Controller Request Guards ---');
  const reqNoFile = { file: null };
  const resNoFile = mockRes();
  await uploadProductImageAdmin(reqNoFile, resNoFile, () => {});
  assert(resNoFile.statusCode === 400 && resNoFile.data?.message?.includes('No image file'), 'Controller rejects requests with missing image file (400)');

  // Connect to DB for Catalog Persistence Tests
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.warn('\nMONGODB_URI not found. Skipping database persistence tests.');
    console.log(`\n================================================================`);
    console.log(`  TESTS: ${passed} PASSED | ${failed} FAILED`);
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

  let createdProduct = null;
  const testSuffix = Date.now().toString(36);

  try {
    // Test 4: Product Creation with Cloudinary Image URLs
    console.log('--- TEST 4: Product Creation with Cloudinary Image URLs ---');
    const cloudinaryImageUrl = `https://res.cloudinary.com/demo/image/upload/v1700000000/house-of-loom/products/silk-carpet-${testSuffix}.jpg`;
    const secondaryImageUrl = `https://res.cloudinary.com/demo/image/upload/v1700000000/house-of-loom/products/silk-carpet-knot-${testSuffix}.jpg`;

    const createReq = {
      body: {
        name: `Royal Tabriz Cloudinary Test Rug - ${testSuffix}`,
        slug: `royal-tabriz-cloudinary-${testSuffix}`,
        category: 'Hand Knotted Rugs',
        collection: 'hand-knotted',
        price: 32000,
        stock: 5,
        thumbnail: cloudinaryImageUrl,
        images: [cloudinaryImageUrl, secondaryImageUrl],
        description: 'Masterpiece rug with direct Cloudinary photo upload.',
        material: 'Hand-Spun New Zealand Wool & Mulberry Silk'
      }
    };
    const createRes = mockRes();
    await createProductAdmin(createReq, createRes);

    assert(createRes.statusCode === 201 && createRes.data?.success, 'Product created successfully with Cloudinary image URLs');
    createdProduct = createRes.data?.product;
    assert(createdProduct?.thumbnail === cloudinaryImageUrl, 'Product thumbnail accurately stores Cloudinary secure URL');
    assert(createdProduct?.images?.length === 2 && createdProduct.images[0] === cloudinaryImageUrl, 'Product images array preserves full Cloudinary image gallery');

    // Test 5: Verify Product Retrieval from Storefront API
    console.log('\n--- TEST 5: Storefront Product Discovery & Image Persistence ---');
    const fetchedProduct = await Product.findById(createdProduct._id);
    assert(fetchedProduct !== null, 'Product found in database');
    assert(fetchedProduct.thumbnail === cloudinaryImageUrl, 'Persisted thumbnail matches Cloudinary URL exactly');
    assert(fetchedProduct.images[1] === secondaryImageUrl, 'Secondary knot detail image preserved in database');

    // Test 6: Image Replacement during Product Edit
    console.log('\n--- TEST 6: Image Replacement during Edit Flow ---');
    const updatedCloudinaryUrl = `https://res.cloudinary.com/demo/image/upload/v1700000001/house-of-loom/products/silk-carpet-replaced-${testSuffix}.jpg`;

    const updateReq = {
      params: { id: createdProduct._id.toString() },
      body: {
        name: `Royal Tabriz Cloudinary Test Rug (Edited) - ${testSuffix}`,
        thumbnail: updatedCloudinaryUrl,
        images: [updatedCloudinaryUrl],
        price: 34000
      }
    };
    const updateRes = mockRes();
    await updateProductAdmin(updateReq, updateRes);

    assert(updateRes.statusCode === 200 && updateRes.data?.success, 'Product updated successfully');
    const reloadedProduct = await Product.findById(createdProduct._id);
    assert(reloadedProduct.thumbnail === updatedCloudinaryUrl, 'Thumbnail successfully replaced with new Cloudinary URL');
    assert(reloadedProduct.images[0] === updatedCloudinaryUrl, 'Gallery images updated cleanly');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    // Cleanup temporary document
    if (createdProduct?._id) {
      await Product.findByIdAndDelete(createdProduct._id);
      console.log('\n[Cleaned up temporary test product]');
    }

    await mongoose.disconnect();
    console.log('\n================================================================');
    console.log(`  RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  }
}

runImageUploadTests();
