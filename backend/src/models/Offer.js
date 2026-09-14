import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Offer name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage',
    required: true
  },
  discountValue: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: [1, 'Discount value must be at least 1']
  },
  minOrderValue: {
    type: Number,
    default: 0,
    min: [0, 'Minimum order value cannot be negative']
  },
  maxDiscount: {
    type: Number,
    default: null, // Cap for percentage discount (e.g. max Rs. 2000 off)
    min: [0, 'Maximum discount cap cannot be negative']
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: [true, 'Expiration date is required']
  },
  usageLimit: {
    type: Number,
    default: null // null indicates unlimited total uses
  },
  usedCount: {
    type: Number,
    default: 0,
    min: 0
  },
  perCustomerLimit: {
    type: Number,
    default: 1,
    min: 1
  },
  usedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    orderNumber: String,
    discountApplied: Number,
    usedAt: {
      type: Date,
      default: Date.now
    }
  }],
  applicableCategories: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, { timestamps: true });

export const Offer = mongoose.model('Offer', offerSchema);
