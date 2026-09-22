import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  name: { type: String, required: true },
  image: { type: String, default: '' },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  dimensions: { type: String, default: '' },
  material: { type: String, default: '' },
  selectedVariant: { type: String, default: '' }
}, { _id: false });

const orderAddressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String, default: '' },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, default: 'India' },
  landmark: { type: String, default: '' }
}, { _id: false });

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  note: { type: String, default: '' }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  items: [orderItemSchema],
  shippingAddress: {
    type: orderAddressSchema,
    required: true
  },
  subtotal: { type: Number, required: true },
  shippingFee: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  baseAmountINR: { type: Number },
  currency: { type: String, default: 'INR' },
  currencyAmount: { type: Number },
  exchangeRate: { type: Number, default: 1 },
  paymentMethod: {
    type: String,
    enum: ['online', 'cod'],
    default: 'cod'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'refund_required'],
    default: 'pending'
  },
  razorpayOrderId: {
    type: String,
    sparse: true,
    index: {
      unique: true,
      partialFilterExpression: { razorpayOrderId: { $type: 'string', $gt: '' } }
    },
    default: null
  },
  razorpayPaymentId: {
    type: String,
    sparse: true,
    index: {
      unique: true,
      partialFilterExpression: { razorpayPaymentId: { $type: 'string', $gt: '' } }
    },
    default: null
  },
  razorpaySignature: { type: String, default: '' },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'confirmed'
  },
  trackingNumber: { type: String, default: '' },
  carrier: { type: String, default: '' },
  shippingNote: { type: String, default: '' },
  couponCode: { type: String, default: '' },
  couponDiscount: { type: Number, default: 0 },
  statusHistory: [statusHistorySchema]
}, { timestamps: true });

// Compound index for user query performance
orderSchema.index({ userId: 1, createdAt: -1 });

export const Order = mongoose.model('Order', orderSchema);
