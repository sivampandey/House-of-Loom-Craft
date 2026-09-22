import mongoose from 'mongoose';
import { SupportTicket } from '../models/SupportTicket.js';
import { Order } from '../models/Order.js';
import { dispatchTicketNotifications } from '../services/notificationService.js';

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
      .limit(5)
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
      aiSuggestedResolution: t.aiSuggestedResolution
    }));
  } catch (err) {
    console.error('[supportController getCustomerTicketsInternal Error]:', err.message);
    return [];
  }
};

/**
 * Internal ticket creator: saves ticket, then asynchronously dispatches notifications
 */
export const createSupportTicketInternal = async ({
  userId = null,
  customerName = 'Valued Client',
  customerEmail = 'client@houseofloomcraft.com',
  customerPhone = '',
  orderNumber = '',
  category = 'General Enquiry',
  priority = 'Normal',
  subject = '',
  customerMessage = '',
  conversationContext = [],
  aiSummary = '',
  aiSuggestedResolution = '',
  attachments = []
}) => {
  try {
    // 1. Deduplication check: prevent creating multiple tickets within 2 minutes for same customer/order/category
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const existingTicket = await SupportTicket.findOne({
      customerEmail: customerEmail.toLowerCase(),
      category,
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
      orderId,
      orderNumber: orderNumber ? String(orderNumber).replace(/#/g, '').trim() : '',
      customerName: customerName.trim() || 'Valued Client',
      customerEmail: customerEmail.trim().toLowerCase(),
      customerPhone: customerPhone.trim(),
      category,
      priority,
      subject: subject.trim() || `${category} Inquiry (${ticketId})`,
      customerMessage: customerMessage.trim(),
      conversationContext: (conversationContext || []).slice(-6).map(c => ({
        role: c.role,
        content: String(c.content).slice(0, 500)
      })),
      aiSummary: aiSummary.trim(),
      aiSuggestedResolution: aiSuggestedResolution.trim(),
      status: 'Open',
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
      isExisting: false
    };
  } catch (err) {
    console.error('[supportController createSupportTicketInternal Exception]:', err.message);
    throw err;
  }
};

// =========================================================================
// ADMIN API CONTROLLERS (/admin/support)
// =========================================================================

/**
 * GET /api/admin/support/tickets
 * Paginated list of tickets with filtering and search
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
        { orderNumber: { $regex: q, $options: 'i' } },
        { subject: { $regex: q, $options: 'i' } }
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
 * Retrieve full ticket details + conversation context + notes
 */
export const getTicketByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await SupportTicket.findOne({
      $or: [
        { ticketId: id },
        ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])
      ]
    }).populate('orderId', 'orderNumber orderStatus total items').lean();

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
 * PUT /api/admin/support/tickets/:id/status
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

    const updates = { status };
    if (status === 'Resolved') updates.resolvedAt = new Date();
    if (status === 'Closed') updates.closedAt = new Date();

    const ticket = await SupportTicket.findOneAndUpdate(
      {
        $or: [
          { ticketId: id },
          ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])
        ]
      },
      { $set: updates },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Support ticket not found.' });
    }

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
 * POST /api/admin/support/tickets/:id/notes
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
            note: note.trim(),
            author,
            createdAt: new Date()
          }
        }
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
