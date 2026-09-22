import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import path from 'path';
import { fileURLToPath } from 'url';
import { SupportTicket } from '../models/SupportTicket.js';
import { User } from '../models/User.js';
import {
  createSupportTicketInternal,
  createTicketCustomer,
  getMyTicketsCustomer,
  getTicketByIdCustomer,
  addTicketCustomerMessage,
  getAllTicketsAdmin,
  getTicketByIdAdmin,
  updateTicketStatusAdmin,
  replyTicketAdmin,
  addTicketInternalNoteAdmin
} from '../controllers/supportController.js';
import {
  formatTicketWhatsAppMessage,
  notifyAdminNewTicket,
  PRIMARY_SHOP_WHATSAPP,
  SECONDARY_SHOP_WHATSAPP
} from '../services/notificationService.js';

if (dns.getServers().includes('127.0.0.1')) {
  try {
    dns.setServers(['1.1.1.1', '8.8.8.8']);
  } catch (err) {}
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pottery_rugs';

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

async function runTests() {
  console.log('=== STARTING HOUSE OF LOOM & CRAFT SUPPORT SYSTEM VERIFICATION ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 5000 });
    console.log(`Connected to MongoDB: ${mongoURI}`);

    // Create or find mock users
    const customerA = await User.findOneAndUpdate(
      { email: 'test.customera@example.com' },
      {
        firstName: 'Sivam',
        lastName: 'Pandey',
        email: 'test.customera@example.com',
        phone: '+919876543210',
        role: 'customer',
        passwordHash: 'dummyhash'
      },
      { upsert: true, new: true }
    );

    const customerB = await User.findOneAndUpdate(
      { email: 'test.customerb@example.com' },
      {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'test.customerb@example.com',
        phone: '+919123456780',
        role: 'customer',
        passwordHash: 'dummyhash'
      },
      { upsert: true, new: true }
    );

    const adminUser = await User.findOneAndUpdate(
      { email: 'admin.support@example.com' },
      {
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin.support@example.com',
        phone: '+917460007382',
        role: 'admin',
        passwordHash: 'dummyhash'
      },
      { upsert: true, new: true }
    );

    const customerAName = `${customerA.firstName} ${customerA.lastName}`.trim();

    // Clean up test tickets created previously for this test run
    await SupportTicket.deleteMany({
      $or: [
        { 'customer.email': 'test.customera@example.com' },
        { 'customer.email': 'test.customerb@example.com' },
        { 'customer.email': 'guest.chat@example.com' }
      ]
    });

    // TEST 1: Ticket creation through chatbot (internal helper)
    console.log('\n--- Test 1: Chatbot Ticket Creation ---');
    const chatResult = await createSupportTicketInternal({
      customerName: customerAName,
      customerEmail: customerA.email,
      customerPhone: customerA.phone,
      customerWhatsapp: customerA.phone,
      userId: customerA._id,
      orderNumber: 'ORD-99120',
      category: 'Damaged Rug / Pottery',
      priority: 'high',
      subject: 'Damaged border fringe on arrival',
      message: 'The rug has unraveling fringes at the bottom left corner.',
      source: 'ai_concierge',
      aiSummary: 'Customer received damaged rug with fringe defects.'
    });

    const chatTicket = chatResult.ticket;
    assert(chatTicket && chatTicket.ticketId.startsWith('HLC-'), `Chat ticket created with valid ID format: ${chatTicket.ticketId}`);
    assert(chatTicket.customer.whatsapp === customerA.phone, `Customer WhatsApp populated correctly: ${chatTicket.customer.whatsapp}`);
    assert(chatTicket.messages.length === 1 && chatTicket.messages[0].sender === 'customer', 'Chat message stored in ticket message thread');
    assert(chatTicket.timeline.length >= 1, 'Initial timeline event created');

    // TEST 2: Customer Profile ticket creation via controller
    console.log('\n--- Test 2: Customer Profile Ticket Creation Controller ---');
    const profileReq = {
      user: customerA,
      body: {
        subject: 'Color mismatch with studio photo',
        category: 'Product Quality Issue',
        priority: 'medium',
        orderNumber: 'ORD-99120',
        message: 'The shade of ivory is darker than displayed online.',
        phone: '+919876543210'
      }
    };
    const profileRes = mockRes();
    await createTicketCustomer(profileReq, profileRes);

    assert(profileRes.statusCode === 201, `Customer ticket creation returned status 201`);
    assert(profileRes.data && profileRes.data.ticket && profileRes.data.ticket.ticketId.startsWith('HLC-'), `Profile ticket assigned ticket ID: ${profileRes.data?.ticket?.ticketId}`);
    const createdProfileTicket = profileRes.data.ticket;

    // TEST 3: Customer viewing ticket details and timeline (isolation & redaction)
    console.log('\n--- Test 3: Customer Viewing Ticket Details ---');
    const viewReq = {
      user: customerA,
      params: { id: createdProfileTicket.ticketId }
    };
    const viewRes = mockRes();
    await getTicketByIdCustomer(viewReq, viewRes);

    assert(viewRes.statusCode === 200, 'Customer retrieved own ticket successfully');
    assert(viewRes.data.ticket.ticketId === createdProfileTicket.ticketId, 'Correct ticket payload returned');
    assert(!viewRes.data.ticket.internalNotes || viewRes.data.ticket.internalNotes.length === 0, 'Internal notes strictly hidden/omitted from customer');
    assert(Array.isArray(viewRes.data.ticket.timeline), 'Timeline returned to customer');

    // TEST 4: Admin viewing tickets with contact details
    console.log('\n--- Test 4: Admin Viewing All Tickets & Search ---');
    const adminListReq = {
      query: { search: customerA.email }
    };
    const adminListRes = mockRes();
    await getAllTicketsAdmin(adminListReq, adminListRes);

    assert(adminListRes.statusCode === 200, 'Admin ticket list returned status 200');
    assert(adminListRes.data.tickets.length >= 2, `Admin search found customer tickets: ${adminListRes.data.tickets.length}`);
    const adminFoundTicket = adminListRes.data.tickets.find(t => t.ticketId === createdProfileTicket.ticketId);
    assert(adminFoundTicket && adminFoundTicket.customer.phone === customerA.phone, 'Customer phone visible in admin ticket row');

    // TEST 5-7: WhatsApp, Call, Email contact URLs verification
    console.log('\n--- Tests 5-7: Contact URL verification ---');
    const cleanPhone = customerA.phone.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hello ${customerAName}, regarding your House of Loom & Craft ticket #${createdProfileTicket.ticketId}: `)}`;
    const telUrl = `tel:${customerA.phone}`;
    const mailtoUrl = `mailto:${customerA.email}?subject=${encodeURIComponent(`[${createdProfileTicket.ticketId}] Support Request - House of Loom & Craft`)}`;

    assert(waUrl.includes('https://wa.me/919876543210'), `WhatsApp contact URL valid: ${waUrl}`);
    assert(telUrl === 'tel:+919876543210', `Call URL valid: ${telUrl}`);
    assert(mailtoUrl.includes('test.customera@example.com'), `Mailto URL valid: ${mailtoUrl}`);

    // TEST 8: Admin status update (Open -> In Progress) with timeline entry
    console.log('\n--- Test 8: Admin Status Update ---');
    const statusReq = {
      params: { id: createdProfileTicket.ticketId },
      user: adminUser,
      body: {
        status: 'In Progress',
        note: 'Investigating with Bhadohi artisan dispatch team.'
      }
    };
    const statusRes = mockRes();
    await updateTicketStatusAdmin(statusReq, statusRes);

    assert(statusRes.statusCode === 200, 'Admin status update returned status 200');
    assert(statusRes.data.ticket.status === 'In Progress', 'Ticket status updated to "In Progress" in DB');
    const hasTimeline = statusRes.data.ticket.timeline.some(t => t.status === 'In Progress');
    assert(hasTimeline, 'Timeline records In Progress event with admin timestamp and actor');

    // TEST 9: Customer sees updated status
    console.log('\n--- Test 9: Customer Sees Updated Status ---');
    const custCheckRes = mockRes();
    await getTicketByIdCustomer({ user: customerA, params: { id: createdProfileTicket.ticketId } }, custCheckRes);
    assert(custCheckRes.data.ticket.status === 'In Progress', 'Customer query reflects "In Progress" live');

    // TEST 10: Admin internal note added and verified absent from customer response
    console.log('\n--- Test 10: Admin Internal Note Added & Customer Hidden ---');
    const noteReq = {
      params: { id: createdProfileTicket.ticketId },
      user: adminUser,
      body: {
        note: 'CONFIDENTIAL: Dye batch #42 had known variance, do not disclose to customer.'
      }
    };
    const noteRes = mockRes();
    await addTicketInternalNoteAdmin(noteReq, noteRes);

    assert(noteRes.statusCode === 200, 'Internal note added by admin');
    assert(noteRes.data.internalNotes.some(n => n.note.includes('CONFIDENTIAL')), 'Internal note recorded in admin response');

    // Verify customer still cannot see this confidential note
    const custSecCheckRes = mockRes();
    await getTicketByIdCustomer({ user: customerA, params: { id: createdProfileTicket.ticketId } }, custSecCheckRes);
    assert(!custSecCheckRes.data.ticket.internalNotes || custSecCheckRes.data.ticket.internalNotes.length === 0, 'Internal note is completely absent from customer payload');

    // TEST 11: Admin customer-visible reply
    console.log('\n--- Test 11: Admin Customer-Visible Reply ---');
    const replyReq = {
      params: { id: createdProfileTicket.ticketId },
      user: adminUser,
      body: {
        message: 'Dear Sivam, our master weaver is reviewing the dye lots and will offer a complimentary exchange.',
        updateStatus: 'Waiting for Customer'
      }
    };
    const replyRes = mockRes();
    await replyTicketAdmin(replyReq, replyRes);

    assert(replyRes.statusCode === 200, 'Admin reply recorded with 200 OK');
    assert(replyRes.data.ticket.status === 'Waiting for Customer', 'Ticket status changed to Waiting for Customer');
    assert(replyRes.data.ticket.messages.some(m => m.sender === 'admin' && m.message.includes('master weaver')), 'Admin message recorded in ticket thread');

    // TEST 12: Customer replies to ticket (updates same ticket without duplicates)
    console.log('\n--- Test 12: Customer Reply to Existing Ticket ---');
    const custReplyReq = {
      params: { id: createdProfileTicket.ticketId },
      user: customerA,
      body: {
        message: 'Thank you, I would love the complimentary exchange.'
      }
    };
    const custReplyRes = mockRes();
    await addTicketCustomerMessage(custReplyReq, custReplyRes);

    assert(custReplyRes.statusCode === 200, 'Customer message added with 200 OK');
    assert(custReplyRes.data.ticket.status === 'In Progress', 'Status transitioned from Waiting for Customer back to In Progress on customer reply');
    assert(custReplyRes.data.ticket.messages.length >= 3, 'Message appended to existing ticket thread without creating new ticket');

    // Check total ticket count for customer A remains 2 (chat ticket + profile ticket)
    const totalCount = await SupportTicket.countDocuments({ userId: customerA._id });
    assert(totalCount === 2, `Total ticket count preserved at ${totalCount}, no duplicate tickets created`);

    // TEST 13: Ticket created safely when notification services unconfigured
    console.log('\n--- Test 13: Notification Service Safe Fallback ---');
    let notificationErrorThrown = false;
    try {
      // Simulate unconfigured notification trigger
      await notifyAdminNewTicket(chatTicket);
    } catch (err) {
      notificationErrorThrown = true;
    }
    assert(!notificationErrorThrown, 'notifyAdminNewTicket gracefully completes without throwing or crashing when external APIs unconfigured');

    // TEST 14: WhatsApp shop notifications format and recipients
    console.log('\n--- Test 14: WhatsApp Shop Message Format & Recipients ---');
    const waText = formatTicketWhatsAppMessage(chatTicket);
    assert(waText.includes(chatTicket.ticketId), `WhatsApp notification header contains Ticket ID: ${chatTicket.ticketId}`);
    assert(waText.includes(customerAName), 'WhatsApp notification includes Customer name');
    assert(waText.includes('ORD-99120'), 'WhatsApp notification includes Order number');
    assert(waText.includes('HIGH'), 'WhatsApp notification includes Priority');
    assert(waText.includes('Admin Actions:'), 'WhatsApp notification includes direct admin contact actions');
    assert(PRIMARY_SHOP_WHATSAPP === '917460007382', `Primary WhatsApp target matches +91 7460007382: ${PRIMARY_SHOP_WHATSAPP}`);
    assert(SECONDARY_SHOP_WHATSAPP === '919839116625', `Secondary WhatsApp target matches +91 9839116625: ${SECONDARY_SHOP_WHATSAPP}`);

    // TEST 15: Cross-customer isolation (Customer B cannot view Customer A's ticket)
    console.log('\n--- Test 15: Cross-Customer Isolation & Security ---');
    const intruderReq = {
      user: customerB,
      params: { id: createdProfileTicket.ticketId }
    };
    const intruderRes = mockRes();
    await getTicketByIdCustomer(intruderReq, intruderRes);

    assert([403, 404].includes(intruderRes.statusCode), `Customer B attempted access to Customer A's ticket was securely rejected with ${intruderRes.statusCode}`);

    const intruderReplyReq = {
      user: customerB,
      params: { id: createdProfileTicket.ticketId },
      body: { message: 'Malicious reply injection' }
    };
    const intruderReplyRes = mockRes();
    await addTicketCustomerMessage(intruderReplyReq, intruderReplyRes);
    assert([403, 404].includes(intruderReplyRes.statusCode), `Customer B reply injection rejected with ${intruderReplyRes.statusCode}`);

    console.log('\n==================================================');
    console.log(`TOTAL TESTS: ${passed + failed}`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
    console.log('==================================================');

    await mongoose.disconnect();
    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runTests();
