import mongoose from 'mongoose';
import { SupportTicket } from '../models/SupportTicket.js';
import { Order } from '../models/Order.js';
import {
  dispatchTicketNotifications,
  notifyCustomerStatusChanged,
  notifyCustomerAdminReply
} from '../services/notificationService.js';

// =========================================================================
// INTERNAL TOOLS (Controlled server-side functions for AI Concierge)
// =========================================================================

/**
 * Fetch authenticated customer's recent orders with non-sensitive fields only
 */
export const getCustomerOrdersInternal = async (userId) => {
  if (!userId) return [];
  try {
    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderNumber orderStatus paymentStatus total carrier trackingNumber createdAt items.name items.quantity')
      .lean();

    return (orders || []).map(o => ({
      orderNumber: o.orderNumber,
      date: o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : 'Recent',
      status: o.orderStatus,
      paymentStatus: o.paymentStatus,
      total: `₹${o.total?.toLocaleString('en-IN')}`,
      carrier: o.carrier || 'Insured Logistics Carrier',
      trackingNumber: o.trackingNumber || 'Pending dispatch confirmation',
      items: (o.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ')
    }));
  } catch (err) {
    console.error('[supportController getCustomerOrdersInternal Error]:', err.message);
    return [];
  }
};

/**
 * Retrieve specific order strictly verifying user ownership
 */
export const getOrderDetailsInternal = async (userId, orderRef) => {
  if (!userId || !orderRef) return null;
  try {
    const cleanRef = String(orderRef).replace(/#/g, '').trim();
    const query = {
      userId,
      $or: [
        { orderNumber: cleanRef },
        ...(mongoose.Types.ObjectId.isValid(cleanRef) ? [{ _id: cleanRef }] : [])
      ]
    };

    const order = await Order.findOne(query)
      .select('orderNumber orderStatus paymentStatus total carrier trackingNumber createdAt items.name items.quantity items.price shippingAddress.city shippingAddress.state')
      .lean();

    if (!order) return null;

    return {
      orderNumber: order.orderNumber,
      date: order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'Recent',
      status: order.orderStatus,
      paymentStatus: order.paymentStatus,
      total: `₹${order.total?.toLocaleString('en-IN')}`,
      carrier: order.carrier || 'Insured Logistics Carrier',
      trackingNumber: order.trackingNumber || 'Pending dispatch confirmation',
      destination: `${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''}`.trim(),
      items: (order.items || []).map(i => `${i.quantity}x ${i.name} (₹${i.price?.toLocaleString('en-IN')})`).join(', ')
    };
  } catch (err) {
    console.error('[supportController getOrderDetailsInternal Error]:', err.message);
    return null;
  }
};

/**
 * Fetch authenticated customer's support tickets
 */
export const getCustomerTicketsInternal = async (userId, userEmail) => {
  if (!userId && !userEmail) return [];
  try {
    const query = userId
      ? { $or: [{ userId }, { customerEmail: userEmail?.toLowerCase() }] }
      : { customerEmail: userEmail?.toLowerCase() };

    const tickets = await SupportTicket.find(query)
      .sort({ createdAt: -1 })
      .limit(10)
      .select('ticketId orderNumber category priority subject status createdAt updatedAt aiSuggestedResolution')
      .lean();

    return (tickets || []).map(t => ({
      ticketId: t.ticketId,
      orderNumber: t.orderNumber || 'N/A',
      category: t.category,
      priority: t.priority,
      subject: t.subject,
      status: t.status,
      created: new Date(t.createdAt).toLocaleDateString('en-IN'),
      updatedAt: t.updatedAt,
      aiSuggestedResolution: t.aiSuggestedResolution
    }));
  } catch (err) {
    console.error('[supportController getCustomerTicketsInternal Error]:', err.message);
    return [];
  }
};

const VALID_CATEGORIES = [
  'Order', 'Delivery', 'Payment', 'Product', 'Damaged Product', 'Wrong Product',
  'Return', 'Refund', 'Cancellation', 'Custom Rug', 'General Enquiry', 'Other'
];

export const normalizeTicketCategory = (cat) => {
  if (!cat) return 'General Enquiry';
  if (VALID_CATEGORIES.includes(cat)) return cat;
  const lower = String(cat).toLowerCase();
  if (lower.includes('damage')) return 'Damaged Product';
  if (lower.includes('wrong')) return 'Wrong Product';
  if (lower.includes('deliver') || lower.includes('shipping') || lower.includes('delay')) return 'Delivery';
  if (lower.includes('pay') || lower.includes('charge')) return 'Payment';
  if (lower.includes('return')) return 'Return';
  if (lower.includes('refund')) return 'Refund';
  if (lower.includes('cancel')) return 'Cancellation';
  if (lower.includes('custom')) return 'Custom Rug';
  if (lower.includes('product') || lower.includes('quality') || lower.includes('color') || lower.includes('size')) return 'Product';
  if (lower.includes('order')) return 'Order';
  return 'Other';
};

export const normalizeTicketPriority = (p) => {
  if (!p) return 'Normal';
  const map = {
    low: 'Low',
    normal: 'Normal',
    medium: 'Normal',
    high: 'High',
    urgent: 'Urgent'
  };
  return map[String(p).toLowerCase()] || 'Normal';
};

/**
 * Internal ticket creator: saves ticket, then asynchronously dispatches notifications
 */
export const createSupportTicketInternal = async ({
  userId = null,
  customerName = 'Valued Client',
  customerEmail = 'client@houseofloomcraft.com',
  customerPhone = '',
  customerWhatsapp = '',
  orderNumber = '',
  category = 'General Enquiry',
  priority = 'Normal',
  subject = '',
  customerMessage = '',
  message = '',
  conversationContext = [],
  aiSummary = '',
  aiSuggestedResolution = '',
  attachments = []
}) => {
  try {
    const cleanCustomerName = customerName.trim() || 'Valued Client';
    const cleanCustomerEmail = customerEmail.trim().toLowerCase();
    const cleanCustomerPhone = customerPhone.trim();
    const cleanCustomerWhatsapp = customerWhatsapp.trim() || cleanCustomerPhone;
    const finalCategory = normalizeTicketCategory(category);
    const finalPriority = normalizeTicketPriority(priority);
    const finalMessage = (customerMessage || message || subject || 'Customer submitted inquiry.').trim();

    // 1. Deduplication check: prevent creating multiple tickets within 2 minutes for same customer/order/category
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const existingTicket = await SupportTicket.findOne({
      customerEmail: cleanCustomerEmail,
      category: finalCategory,
      createdAt: { $gte: twoMinutesAgo },
      ...(orderNumber ? { orderNumber } : {})
    }).select('ticketId status createdAt');

    if (existingTicket) {
      console.log(`[SupportTicket Deduplication] Reusing recently created ticket ${existingTicket.ticketId}`);
      return {
        ticketId: existingTicket.ticketId,
        status: existingTicket.status,
        isExisting: true
      };
    }

    // 2. Generate unique Ticket ID
    const ticketId = await SupportTicket.generateTicketId();

    // 3. Resolve orderId if orderNumber is provided
    let orderId = null;
    if (orderNumber) {
      const order = await Order.findOne({ orderNumber: String(orderNumber).replace(/#/g, '').trim() }).select('_id');
      if (order) orderId = order._id;
    }

    // 4. Create SupportTicket in MongoDB
    const newTicket = new SupportTicket({
      ticketId,
      userId,
      customer: {
        name: cleanCustomerName,
        email: cleanCustomerEmail,
        phone: cleanCustomerPhone,
        whatsapp: cleanCustomerWhatsapp
      },
      orderId,
      orderNumber: orderNumber ? String(orderNumber).replace(/#/g, '').trim() : '',
      customerName: cleanCustomerName,
      customerEmail: cleanCustomerEmail,
      customerPhone: cleanCustomerPhone,
      category: finalCategory,
      priority: finalPriority,
      subject: subject.trim() || `${finalCategory} Inquiry (${ticketId})`,
      customerMessage: finalMessage,
      conversationContext: (conversationContext || []).slice(-6).map(c => ({
        role: c.role,
        content: String(c.content).slice(0, 500)
      })),
      aiSummary: aiSummary.trim(),
      aiSuggestedResolution: aiSuggestedResolution.trim(),
      status: 'Open',
      messages: finalMessage ? [{
        sender: 'customer',
        message: finalMessage,
        attachments: attachments || [],
        createdAt: new Date()
      }] : [],
      timeline: [{
        type: 'created',
        status: 'Open',
        message: 'Complaint submitted',
        visibleToCustomer: true,
        createdAt: new Date()
      }],
      attachments: attachments || []
    });

    await newTicket.save();
    console.log(`[SupportTicket Created] Ticket ID: ${ticketId} saved successfully.`);

    // 5. Asynchronously trigger notifications (Never blocks customer response)
    dispatchTicketNotifications(ticketId).catch(err => {
      console.error('[SupportTicket Notification Dispatch Error]:', err.message);
    });

    return {
      ticketId,
      status: 'Open',
      isExisting: false,
      ticket: newTicket
    };
  } catch (err) {
    console.error('[supportController createSupportTicketInternal Exception]:', err.message);
    throw err;
  }
};

// =========================================================================
// CUSTOMER API CONTROLLERS (/api/support)
// Strictly authenticates user via req.user._id
// =========================================================================

/**
 * GET /api/support/tickets
 * Retrieve all tickets belonging ONLY to the authenticated customer
 */
export const getMyTicketsCustomer = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const userId = req.user._id;
    const userEmail = req.user.email?.toLowerCase();

    const tickets = await SupportTicket.find({
      $or: [
        { userId },
        ...(userEmail ? [{ customerEmail: userEmail }] : [])
      ]
    })
      .select('-internalNotes')
      .sort({ createdAt: -1 })
      .populate('orderId', 'orderNumber orderStatus total createdAt')
      .lean();

    // Sanitize timeline entries so customer only sees visibleToCustomer !== false
    const sanitizedTickets = (tickets || []).map(t => ({
      ...t,
      timeline: (t.timeline || []).filter(item => item.visibleToCustomer !== false)
    }));

    return res.status(200).json({
      success: true,
      tickets: sanitizedTickets
    });
  } catch (err) {
    console.error('[getMyTicketsCustomer Error]:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve support tickets.' });
  }
};

/**
 * GET /api/support/tickets/:id
 * Retrieve customer ticket details with strict ownership verification
 */
export const getTicketByIdCustomer = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { id } = req.params;
    const ticket = await SupportTicket.findOne({
      $or: [
        { ticketId: id },
        ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])
      ]
    })
      .select('-internalNotes')
      .populate('orderId', 'orderNumber orderStatus total items carrier trackingNumber shippingAddress createdAt')
      .lean();

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Support ticket not found.' });
    }

    // Strict ownership verification: cannot view another customer's ticket
    const isOwner =
      (ticket.userId && ticket.userId.toString() === req.user._id.toString()) ||
      (ticket.customerEmail && ticket.customerEmail.toLowerCase() === req.user.email.toLowerCase());

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have authorization to view this ticket.'
      });
    }

    // Filter timeline to only customer-visible entries
    ticket.timeline = (ticket.timeline || []).filter(item => item.visibleToCustomer !== false);

    return res.status(200).json({
      success: true,
      ticket
    });
  } catch (err) {
    console.error('[getTicketByIdCustomer Error]:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve ticket details.' });
  }
};

/**
 * POST /api/support/tickets
 * Customer creates a complaint / support ticket capturing verified account details
 */
export const createTicketCustomer = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const {
      orderNumber = '',
      category = 'General Enquiry',
      priority = 'Normal',
      subject = '',
      customerMessage,
      message,
      phone = '',
      whatsapp = '',
      attachments = []
    } = req.body;

    const finalMsg = (customerMessage || message || '').trim();
    if (!finalMsg) {
      return res.status(400).json({ success: false, message: 'Complaint message is required.' });
    }

    // Capture verified identity from req.user
    const verifiedName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Valued Client';
    const verifiedEmail = req.user.email;
    const verifiedPhone = phone.trim() || req.user.phone || '';
    const verifiedWhatsapp = whatsapp.trim() || verifiedPhone;

    const result = await createSupportTicketInternal({
      userId: req.user._id,
      customerName: verifiedName,
      customerEmail: verifiedEmail,
      customerPhone: verifiedPhone,
      customerWhatsapp: verifiedWhatsapp,
      orderNumber,
      category,
      priority,
      subject: subject.trim() || `${category} Complaint`,
      customerMessage: finalMsg,
      attachments: attachments || []
    });

    return res.status(201).json({
      success: true,
      message: 'Support ticket registered successfully.',
      ticketId: result.ticketId,
      status: result.status,
      isExisting: result.isExisting,
      ticket: result.ticket
    });
  } catch (err) {
    console.error('[createTicketCustomer Error]:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to create support ticket.' });
  }
};

/**
 * POST /api/support/tickets/:id/messages
 * Customer sends a reply / additional information / attachments to an existing ticket
 */
export const addTicketCustomerMessage = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { id } = req.params;
    const { message, attachments = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty.' });
    }

    const ticket = await SupportTicket.findOne({
      $or: [
        { ticketId: id },
        ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])
      ]
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Support ticket not found.' });
    }

    // Ownership check
    const isOwner =
      (ticket.userId && ticket.userId.toString() === req.user._id.toString()) ||
      (ticket.customerEmail && ticket.customerEmail.toLowerCase() === req.user.email.toLowerCase());

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have authorization to update this ticket.'
      });
    }

    // Append to messages array
    ticket.messages.push({
      sender: 'customer',
      message: message.trim(),
      attachments: attachments || [],
      createdAt: new Date()
    });

    // If ticket was Waiting for Customer, move back to In Progress
    let statusUpdated = false;
    if (ticket.status === 'Waiting for Customer') {
      ticket.status = 'In Progress';
      statusUpdated = true;
    }

    // Add entry to timeline
    ticket.timeline.push({
      type: 'customer_reply',
      status: ticket.status,
      message: 'Customer provided requested information',
      visibleToCustomer: true,
      createdAt: new Date()
    });

    ticket.updatedAt = new Date();
    await ticket.save();

    console.log(`[SupportTicket Reply] Customer replied to ${ticket.ticketId}`);

    return res.status(200).json({
      success: true,
      message: 'Message added to support ticket.',
      ticketId: ticket.ticketId,
      status: ticket.status,
      messages: ticket.messages,
      timeline: ticket.timeline.filter(t => t.visibleToCustomer !== false),
      ticket
    });
  } catch (err) {
    console.error('[addTicketCustomerMessage Error]:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to add message to ticket.' });
  }
};

// =========================================================================
// ADMIN API CONTROLLERS (/admin/support)
// =========================================================================

/**
 * GET /api/admin/support/tickets
 * Paginated list of tickets with multi-field search and filters
 */
export const getAllTicketsAdmin = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    const { status, priority, category, search } = req.query;

    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (priority && priority !== 'all') filter.priority = priority;
    if (category && category !== 'all') filter.category = category;

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { ticketId: { $regex: q, $options: 'i' } },
        { customerName: { $regex: q, $options: 'i' } },
        { customerEmail: { $regex: q, $options: 'i' } },
        { customerPhone: { $regex: q, $options: 'i' } },
        { 'customer.whatsapp': { $regex: q, $options: 'i' } },
        { orderNumber: { $regex: q, $options: 'i' } },
        { subject: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { status: { $regex: q, $options: 'i' } }
      ];
    }

    const [tickets, totalCount] = await Promise.all([
      SupportTicket.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SupportTicket.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      tickets,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1
      }
    });
  } catch (err) {
    console.error('[getAllTicketsAdmin Error]:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve support tickets.' });
  }
};

/**
 * GET /api/admin/support/tickets/:id
 * Retrieve full ticket details + conversation context + order details + internal notes
 */
export const getTicketByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await SupportTicket.findOne({
      $or: [
        { ticketId: id },
        ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])
      ]
    })
      .populate('orderId', 'orderNumber orderStatus total items carrier trackingNumber shippingAddress createdAt')
      .populate('userId', 'firstName lastName email phone createdAt')
      .lean();

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Support ticket not found.' });
    }

    return res.status(200).json({ success: true, ticket });
  } catch (err) {
    console.error('[getTicketByIdAdmin Error]:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch ticket details.' });
  }
};

/**
 * PUT / PATCH /api/admin/support/tickets/:id/status
 * Update ticket status (Open, In Progress, Waiting for Customer, Resolved, Closed)
 */
export const updateTicketStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Open', 'In Progress', 'Waiting for Customer', 'Resolved', 'Closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid ticket status.' });
    }

    const ticket = await SupportTicket.findOne({
      $or: [
        { ticketId: id },
        ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])
      ]
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Support ticket not found.' });
    }

    const oldStatus = ticket.status;
    ticket.status = status;
    if (status === 'Resolved') ticket.resolvedAt = new Date();
    if (status === 'Closed') ticket.closedAt = new Date();

    // Append status-change entry to timeline
    ticket.timeline.push({
      type: 'status_change',
      status,
      message: `Support team moved this ticket to ${status}.`,
      visibleToCustomer: true,
      createdAt: new Date()
    });

    ticket.updatedAt = new Date();
    await ticket.save();

    console.log(`[SupportTicket Status Updated] ${ticket.ticketId}: ${oldStatus} -> ${status}`);

    // Asynchronously trigger customer notification if configured
    notifyCustomerStatusChanged(ticket, oldStatus, status).catch(err => {
      console.error('[Customer Notification Error]:', err.message);
    });

    return res.status(200).json({
      success: true,
      message: `Ticket status updated to ${status}.`,
      ticket
    });
  } catch (err) {
    console.error('[updateTicketStatusAdmin Error]:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to update ticket status.' });
  }
};

/**
 * POST /api/admin/support/tickets/:id/reply
 * Send customer-visible support response
 */
export const replyTicketAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, attachments = [], updateStatus, status: newStatus } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Response message cannot be empty.' });
    }

    const ticket = await SupportTicket.findOne({
      $or: [
        { ticketId: id },
        ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])
      ]
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Support ticket not found.' });
    }

    const targetStatus = updateStatus || newStatus;
    if (targetStatus && ['Open', 'In Progress', 'Waiting for Customer', 'Resolved', 'Closed'].includes(targetStatus)) {
      ticket.status = targetStatus;
    }

    // Add message to customer-visible messages thread
    ticket.messages.push({
      sender: 'admin',
      message: message.trim(),
      attachments: attachments || [],
      createdAt: new Date()
    });

    // Add timeline entry
    ticket.timeline.push({
      type: 'admin_reply',
      status: ticket.status,
      message: 'Support team responded to your inquiry',
      visibleToCustomer: true,
      createdAt: new Date()
    });

    ticket.updatedAt = new Date();
    await ticket.save();

    console.log(`[SupportTicket Admin Reply] Response sent on ${ticket.ticketId}`);

    // Asynchronously trigger customer notification
    notifyCustomerAdminReply(ticket, message.trim()).catch(err => {
      console.error('[Customer Reply Notification Error]:', err.message);
    });

    return res.status(200).json({
      success: true,
      message: 'Response sent to customer successfully.',
      ticket
    });
  } catch (err) {
    console.error('[replyTicketAdmin Error]:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to send response.' });
  }
};

/**
 * POST /api/admin/support/tickets/:id/notes or /internal-note
 * Add internal staff note (never exposed to customer)
 */
export const addTicketInternalNoteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ success: false, message: 'Note text cannot be empty.' });
    }

    const author = req.user
      ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email
      : 'Atelier Support Staff';

    const ticket = await SupportTicket.findOneAndUpdate(
      {
        $or: [
          { ticketId: id },
          ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])
        ]
      },
      {
        $push: {
          internalNotes: {
            adminId: req.user?._id || null,
            author,
            note: note.trim(),
            createdAt: new Date()
          }
        },
        $set: { updatedAt: new Date() }
      },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Support ticket not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Internal note recorded.',
      internalNotes: ticket.internalNotes
    });
  } catch (err) {
    console.error('[addTicketInternalNoteAdmin Error]:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to add internal note.' });
  }
};

