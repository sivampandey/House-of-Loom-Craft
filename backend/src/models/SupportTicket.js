import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  url: { type: String, required: true },
  name: { type: String, default: 'Attachment' },
  type: { type: String, default: 'image' },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const internalNoteSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  author: { type: String, default: 'Atelier Support Team' },
  note: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const ticketMessageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['customer', 'admin'], required: true },
  message: { type: String, required: true, trim: true },
  attachments: [attachmentSchema],
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const timelineEntrySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['created', 'status_change', 'admin_reply', 'customer_reply', 'info_requested'],
    default: 'created'
  },
  status: { type: String, default: 'Open' },
  message: { type: String, required: true },
  visibleToCustomer: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const conversationMessageSchema = new mongoose.Schema({
  role: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const supportTicketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  customer: {
    name: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
    phone: { type: String, default: '', trim: true },
    whatsapp: { type: String, default: '', trim: true }
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null,
    index: true
  },
  orderNumber: {
    type: String,
    default: '',
    trim: true,
    index: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  customerPhone: {
    type: String,
    default: '',
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Order',
      'Delivery',
      'Payment',
      'Product',
      'Damaged Product',
      'Wrong Product',
      'Return',
      'Refund',
      'Cancellation',
      'Custom Rug',
      'General Enquiry',
      'Other'
    ],
    default: 'General Enquiry',
    index: true
  },
  priority: {
    type: String,
    required: true,
    enum: ['Low', 'Normal', 'High', 'Urgent'],
    default: 'Normal',
    index: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  customerMessage: {
    type: String,
    required: true
  },
  conversationContext: [conversationMessageSchema],
  aiSummary: {
    type: String,
    default: ''
  },
  aiSuggestedResolution: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    required: true,
    enum: ['Open', 'In Progress', 'Waiting for Customer', 'Resolved', 'Closed'],
    default: 'Open',
    index: true
  },
  messages: [ticketMessageSchema],
  timeline: [timelineEntrySchema],
  attachments: [attachmentSchema],
  internalNotes: [internalNoteSchema],
  notifications: {
    whatsapp: {
      status: { type: String, enum: ['pending', 'sent', 'failed', 'not_configured'], default: 'pending' },
      attemptedAt: { type: Date, default: null },
      error: { type: String, default: null }
    },
    email: {
      status: { type: String, enum: ['pending', 'sent', 'failed', 'not_configured'], default: 'pending' },
      attemptedAt: { type: Date, default: null },
      error: { type: String, default: null }
    }
  },
  resolvedAt: { type: Date, default: null },
  closedAt: { type: Date, default: null }
}, {
  timestamps: true
});

// Helper static method to generate a clean, sequential ticket ID (e.g. HLC-1047)
supportTicketSchema.statics.generateTicketId = async function () {
  const count = await this.countDocuments();
  const nextNum = 1001 + count;
  let candidate = `HLC-${nextNum}`;
  let exists = await this.findOne({ ticketId: candidate });
  let suffix = 1;
  while (exists) {
    candidate = `HLC-${nextNum + suffix}`;
    exists = await this.findOne({ ticketId: candidate });
    suffix++;
  }
  return candidate;
};

export const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
export default SupportTicket;
