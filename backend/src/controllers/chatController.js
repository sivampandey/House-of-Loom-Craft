import { GoogleGenAI } from '@google/genai';
import dns from 'dns';
import { Product } from '../models/Product.js';
import { Offer } from '../models/Offer.js';
import { Order } from '../models/Order.js';
import {
  getCustomerOrdersInternal,
  getOrderDetailsInternal,
  getCustomerTicketsInternal,
  createSupportTicketInternal
} from './supportController.js';
import { getExchangeRate, convertFromINR, SUPPORTED_CURRENCY_CODES } from '../services/currencyService.js';

// Ensure DNS resolution on Windows does not stall API calls
try {
  if (dns.getServers().includes('127.0.0.1')) {
    dns.setServers(['1.1.1.1', '8.8.8.8']);
  }
} catch (_) {}

// Centralized configurable Gemini Model (default: gemini-3.6-flash, confirmed supported)
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

// Verified Atelier Knowledge Base (grounded strictly in existing codebase facts)
const ATELIER_FACTS = `
Brand: House of Loom & Craft (Manufacturer & Exporter)
Atelier & Heritage: G.T. Road, Ghosia, Aurai, Bhadohi 221301, U.P. (India). Bhadohi is celebrated globally for generational master carpet weaving.
Collections:
- Hand Knotted Rugs: Generational single-knot heirlooms on master looms (e.g. 400-450 KPSI) with high-plateau wool and pure mulberry silk inlay.
- Hand Tufted Rugs: Sculpted high-low pile architectural luxury.
- Hand Woven Rugs: Artisanal organic flatweaves and fine kilims.
- Handloom Rugs: Textured pure wool and lustrous fibers.
- Bespoke / Custom Rugs: Architectural scale, custom dye, density & special shapes.
- Home Decor: Hand-embroidered cushions, cashmere & pashmina throws, bouclé poufs, antique hand-beaten brass, monolith travertine tables.
Shipping Policy: Complimentary insured nationwide shipping across India.
Dispatch: Per-piece dispatch lead times are specified in the catalog (e.g. In stock pieces dispatch in 24-48 hours).
Payment Methods: Online payment (Credit/Debit Cards, UPI, NetBanking via Razorpay) and Cash on Delivery (COD).
Contact & Atelier Concierge:
- WhatsApp / Phone (Primary): +91 7460007382, (Secondary): +91 9839116625
- Email: Potteryrugs@gmail.com
Unverified Policy Rule: If a customer inquires about custom return conditions, guarantees, international export quotes, or policies not documented above, invite them warmly to consult the master artisans directly via WhatsApp or phone. Never invent policy details.
`;

// In-memory cache for active catalog products to avoid blocking conversational queries on MongoDB
let productCache = {
  data: [],
  timestamp: 0
};
const PRODUCT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Fast in-memory / DB fetch with 2.5s timeout guarantee
async function getCatalogProducts() {
  if (productCache.data.length > 0 && Date.now() - productCache.timestamp < PRODUCT_CACHE_TTL) {
    return productCache.data;
  }
  try {
    const dbPromise = Product.find({ isActive: true })
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(16)
      .select('name slug price compareAtPrice dimensions material collectionName category leadTime stock thumbnail images badge shortDescription')
      .lean();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('DB_TIMEOUT')), 2500)
    );

    const products = await Promise.race([dbPromise, timeoutPromise]);
    if (products && products.length > 0) {
      productCache = { data: products, timestamp: Date.now() };
      return products;
    }
    return productCache.data || [];
  } catch (err) {
    console.warn('[Chatbot Notice] Product fetch timed out or unavailable, using in-memory cache:', err.message);
    return productCache.data || [];
  }
}

// Fast conversational classifier regex patterns
const PURE_GREETING_REGEX = /^(hi|hello|hey|heya|hiya|greetings|good\s*(morning|afternoon|evening|day)|hola|namaste|pranam)[\s!.?]*$/i;
const PURE_THANKS_REGEX = /^(thanks|thank\s*you|thankyou|thx|tysm|many\s*thanks|appreciate\s*it)[\s!.?]*$/i;
const PURE_BYE_REGEX = /^(bye|goodbye|see\s*you|take\s*care|cya|farewell)[\s!.?]*$/i;
const PURE_HELP_REGEX = /^(what\s*can\s*you\s*help\s*(me\s*)?with\??|help|how\s*can\s*you\s*help\??|who\s*are\s*you\??|what\s*do\s*you\s*do\??)[\s!.?]*$/i;

// Helper: Extract search terms from user prompt
function extractSearchKeywords(text) {
  if (!text) return '';
  return text
    .replace(/[^\w\s\u0900-\u097F]/gi, ' ')
    .split(/\s+/)
    .filter(word => {
      const w = word.toLowerCase();
      const stopWords = ['i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'they',
        'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
        'have', 'has', 'had', 'do', 'does', 'did', 'to', 'from', 'in', 'out', 'on', 'off',
        'for', 'with', 'about', 'want', 'need', 'show', 'tell', 'looking', 'find', 'recommend',
        'please', 'can', 'could', 'would', 'like', 'something', 'good', 'best', 'some',
        'give', 'get', 'any', 'which', 'what', 'rug', 'rugs', 'carpet', 'carpets'];
      return w.length > 2 && !stopWords.includes(w);
    })
    .slice(0, 6)
    .join(' ');
}

// Helper: Extract budget constraints if mentioned
function extractBudget(text) {
  const budgetMatch = text.match(/(?:under|below|less than|budget|within|up to|max(?:imum)?)\s*(?:rs\.?|inr|₹)?\s*(\d+[\d,]*)/i)
    || text.match(/(?:rs\.?|inr|₹)\s*(\d+[\d,]*)/i);
  if (budgetMatch && budgetMatch[1]) {
    const num = parseInt(budgetMatch[1].replace(/,/g, ''), 10);
    if (!isNaN(num) && num > 500 && num < 10000000) {
      return num;
    }
  }
  return null;
}

// Helper: Sanitize and guarantee complete, well-formed sentence response
function sanitizeAndValidateText(rawText, fallbackText) {
  if (!rawText || typeof rawText !== 'string') return fallbackText;
  let text = rawText.trim();

  // Strip any accidental thought or reasoning blocks
  text = text.replace(/<thought>[\s\S]*?<\/thought>/gi, '').trim();
  text = text.replace(/^(?:thought|reasoning|internal note):\s*/i, '').trim();
  text = text.replace(/^.*?exists in catalog\.\s*let'?s showcase\s*/i, '').trim();

  // Remove any leaked raw product field patterns
  text = text.replace(/(?:Direct Link|Slug|Lead Time|Price):\s*[^\n]+/gi, '').trim();

  // Check if text ends properly with punctuation
  const endsWithPunctuation = /[.!?)"']$/.test(text);
  if (!endsWithPunctuation) {
    const lastPunctuation = Math.max(text.lastIndexOf('. '), text.lastIndexOf('? '), text.lastIndexOf('! '));
    if (lastPunctuation > 20) {
      text = text.substring(0, lastPunctuation + 1).trim();
    } else if (text.lastIndexOf('.') > 20) {
      text = text.substring(0, text.lastIndexOf('.') + 1).trim();
    } else {
      return fallbackText;
    }
  }

  if (text.length < 15) return fallbackText;
  return text;
}

// Product category classifiers
function isRugProduct(p) {
  if (!p) return false;
  const col = (p.collection || '').toLowerCase();
  const colName = (p.collectionName || '').toLowerCase();
  const cat = (p.category || '').toLowerCase();
  const name = (p.name || '').toLowerCase();
  const slug = (p.slug || '').toLowerCase();

  // Exclude explicit home-decor products
  if (
    col === 'home-decor' ||
    cat.includes('brass') ||
    cat.includes('pouf') ||
    cat.includes('throw') ||
    cat.includes('furniture') ||
    cat.includes('table') ||
    name.includes('brass urn') ||
    name.includes('pouf') ||
    name.includes('throw') ||
    name.includes('table')
  ) {
    return false;
  }

  return (
    col.includes('rug') ||
    col.includes('carpet') ||
    col.includes('knot') ||
    col.includes('tuft') ||
    col.includes('weave') ||
    col.includes('loom') ||
    col.includes('bespoke') ||
    colName.includes('rug') ||
    colName.includes('carpet') ||
    cat.includes('rug') ||
    cat.includes('carpet') ||
    name.includes('rug') ||
    name.includes('carpet') ||
    slug.includes('rug') ||
    slug.includes('carpet') ||
    slug.includes('bespoke')
  );
}

function isDecorProduct(p) {
  if (!p) return false;
  const col = (p.collection || '').toLowerCase();
  const cat = (p.category || '').toLowerCase();
  const colName = (p.collectionName || '').toLowerCase();
  const name = (p.name || '').toLowerCase();

  return (
    col === 'home-decor' ||
    col.includes('decor') ||
    cat.includes('decor') ||
    colName.includes('decor') ||
    cat.includes('textiles') ||
    cat.includes('cushion') ||
    cat.includes('throw') ||
    cat.includes('brass') ||
    cat.includes('furniture') ||
    cat.includes('pouf') ||
    name.includes('urn') ||
    name.includes('pouf') ||
    name.includes('throw') ||
    name.includes('cushion') ||
    name.includes('table')
  );
}

// Multi-turn context analyzer
function analyzeConversationContext(message, sanitizedHistory = []) {
  const currentText = (message || '').toLowerCase();

  // Extract previous turns
  const userTurns = sanitizedHistory
    .filter(h => h && h.role === 'user' && typeof h.content === 'string')
    .map(h => h.content.toLowerCase());
  const allTurns = sanitizedHistory
    .filter(h => h && typeof h.content === 'string')
    .map(h => h.content.toLowerCase());

  // 1. Detect Dimensions in current message
  const dimMatch = currentText.match(/\b(\d+(?:\.\d+)?)\s*(?:by|x|\*|\s*(?:feet|ft|'|foot))\s*(\d+(?:\.\d+)?)\s*(?:feet|ft|'|foot)?\b/i)
    || currentText.match(/\b(\d+(?:\.\d+)?)\s*(?:feet|ft|'|foot)\b/i);

  const hasDimension = Boolean(dimMatch);
  const dimensionString = dimMatch ? dimMatch[0] : '';

  // 2. Detect Room: Check current message first, then search history (newest first)
  let room = null;
  const roomPatterns = [
    { type: 'bedroom', regex: /\b(bed\s*room|bed\s*rooms?)\b/i },
    { type: 'living_room', regex: /\b(living\s*room|sitting\s*room|drawing\s*room|lounge)\b/i },
    { type: 'dining_room', regex: /\b(dining\s*room|dining\s*table|dining\s*area|dining)\b/i },
    { type: 'hallway', regex: /\b(hallway|entryway|foyer|corridor|passage|runner)\b/i },
    { type: 'office', regex: /\b(office|study|library|workspace)\b/i }
  ];

  for (const rp of roomPatterns) {
    if (rp.regex.test(currentText)) {
      room = rp.type;
      break;
    }
  }

  // If room not in current message, inherit from user history
  if (!room) {
    for (let i = userTurns.length - 1; i >= 0; i--) {
      for (const rp of roomPatterns) {
        if (rp.regex.test(userTurns[i])) {
          room = rp.type;
          break;
        }
      }
      if (room) break;
    }
  }

  // Also check assistant responses in history
  if (!room) {
    for (let i = allTurns.length - 1; i >= 0; i--) {
      for (const rp of roomPatterns) {
        if (rp.regex.test(allTurns[i])) {
          room = rp.type;
          break;
        }
      }
      if (room) break;
    }
  }

  // 3. Category & Specific Intent Detection
  const customRugRegex = /\b(custom\s*rug|bespoke\s*rug|custom\s*carpet|made\s*for\s*my\s*room|custom\s*weaving|custom\s*scale|custom\s*size|wanna\s*custom|bespoke)\b/i;
  const generalRugRegex = /\b(rug|rugs|carpet|carpets|dhurrie|kilim|flatweave|hand\s*knotted|hand\s*tufted|handloom|area\s*rug)\b/i;
  const decorRegex = /\b(decor|cushion|cushions|throw|throws|pouf|poufs|brass|urn|vase|table|tables|furniture|accent|accents)\b/i;
  const whatRugsRegex = /what\s*rugs|which\s*rugs|what\s*(kind\s*of\s*)?rugs\s*do\s*you\s*(have|offer|make)|show\s*(me\s*)?(your\s*)?rugs|explore\s*rugs/i;

  let isCustom = customRugRegex.test(currentText);
  let isRug = generalRugRegex.test(currentText) || Boolean(room) || isCustom;
  let isDecor = decorRegex.test(currentText);
  let isWhatRugs = whatRugsRegex.test(currentText);

  // Inherit category from history if current turn has dimensions or is a follow-up
  if (!isCustom && !isRug && !isDecor) {
    for (let i = userTurns.length - 1; i >= 0; i--) {
      if (customRugRegex.test(userTurns[i])) {
        isCustom = true;
        isRug = true;
        break;
      } else if (generalRugRegex.test(userTurns[i])) {
        isRug = true;
        break;
      } else if (decorRegex.test(userTurns[i])) {
        isDecor = true;
        break;
      }
    }
  }

  // Check for Flow E: Dimensions provided with NO prior room/category context
  const isDimensionWithoutContext = hasDimension && !room && !isCustom && !isDecor && userTurns.length === 0;

  return {
    hasDimension,
    dimensionString,
    room,
    isCustom,
    isRug,
    isDecor,
    isWhatRugs,
    isDimensionWithoutContext
  };
}

// Generate contextual guidance and fallback response
function generateContextualGuidance(context) {
  if (context.isDimensionWithoutContext) {
    return "Those are wonderful proportions. Could you share which room these dimensions are for — such as a living room, bedroom, or dining space — and your furniture layout? I’ll gladly recommend the ideal rug sizing and curated pieces for your space.";
  }

  if (context.room === 'bedroom') {
    if (context.hasDimension) {
      return "Perfect. For a 10 × 12 ft bedroom, an 8 × 10 ft rug would be a versatile choice, especially if you want it positioned beneath the lower two-thirds of the bed. If you'd like more floor coverage, we can also consider a larger option.";
    }
    return "For a serene and comfortable bedroom, we recommend soft, plush textures and calming palettes. Here are curated pieces from our atelier that pair beautifully with bedroom spaces.";
  }

  if (context.room === 'living_room') {
    if (context.hasDimension) {
      return "For a 10 × 12 ft living room space, an 8 × 10 ft rug is an ideal choice to anchor the seating area with the front legs of your sofa resting comfortably on the pile.";
    }
    return "Absolutely. For a living room, I can help you choose a rug based on your room size, sofa layout, and preferred style. Here are a few pieces from our collection that could work well.";
  }

  if (context.room === 'dining_room') {
    if (context.hasDimension) {
      return "For a 10 × 12 ft dining space, an 8 × 10 ft rug accommodates a standard dining table with ample clearance for chairs when pushed back.";
    }
    return "For a dining area, an 8' x 10' or 9' x 12' rug ensures chair legs remain comfortably on the pile when seated. Here are durable, artisan-crafted pieces suited for dining spaces.";
  }

  if (context.isCustom) {
    return "Absolutely. We can help you explore a custom rug for your space. Tell me your room size, preferred colours, and the style you have in mind, and I’ll guide you from there.";
  }

  if (context.isWhatRugs) {
    return "We craft generational Hand Knotted heirlooms, sculpted Hand Tufted wool rugs, organic Hand Woven flatweaves, and Bespoke custom architectural pieces. Here are curated examples from our Bhadohi atelier.";
  }

  if (context.isDecor) {
    return "Our home decor collection features hand-embroidered silk cushions, hand-spun cashmere throws, bouclé wool poufs, and hand-hammered antique brass accents. Here are curated pieces from our atelier.";
  }

  if (context.isRug) {
    return "Here are a few curated handcrafted rugs from our collection that could work well for your space. Tell me a little about your room layout or preferences, and I’ll guide you further.";
  }

  return "I’d be happy to help you find the right piece. Could you tell me a little more about your space and preferred style?";
}

export const handleChat = async (req, res) => {
  let recommendedProducts = [];
  let context = {
    hasDimension: false,
    dimensionString: '',
    room: null,
    isCustom: false,
    isRug: false,
    isDecor: false,
    isWhatRugs: false,
    isDimensionWithoutContext: false
  };

  try {
    const rawMessage = req.body?.message;
    const rawHistory = req.body?.history;
    const rawCurrency = req.body?.currency || req.body?.selectedCurrency;
    const customerCurrency = (rawCurrency && typeof rawCurrency === 'string' && SUPPORTED_CURRENCY_CODES.includes(rawCurrency.toUpperCase()))
      ? rawCurrency.toUpperCase()
      : 'INR';

    // 1. Input Validation
    if (!rawMessage || typeof rawMessage !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Message is required and must be text.'
      });
    }

    const message = rawMessage.trim();
    if (message.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty.'
      });
    }

    if (message.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Message is too long. Please limit your inquiry to 500 characters.'
      });
    }

    const lowerMsg = message.toLowerCase();

    // 2. Fast-Path: Simple Conversational Messages (0ms DB delay, no Gemini API call required)
    if (PURE_GREETING_REGEX.test(lowerMsg)) {
      return res.status(200).json({
        success: true,
        message: "Hello! Welcome to House of Loom & Craft. What are you looking for today — a rug, home decor piece, or help choosing something for your space?",
        products: []
      });
    }

    if (PURE_THANKS_REGEX.test(lowerMsg)) {
      return res.status(200).json({
        success: true,
        message: "You are most welcome! Please let me know if you need anything else for your home or rugs.",
        products: []
      });
    }

    if (PURE_BYE_REGEX.test(lowerMsg)) {
      return res.status(200).json({
        success: true,
        message: "Goodbye! Have a wonderful day, and feel free to return whenever you need bespoke interior assistance.",
        products: []
      });
    }

    if (PURE_HELP_REGEX.test(lowerMsg)) {
      return res.status(200).json({
        success: true,
        message: "I am your AI Concierge for House of Loom & Craft. I can help you discover handcrafted rugs, explore luxury decor accents, advise on sizing and materials for your rooms, check your orders, or share current offers. How may I assist you today?",
        products: []
      });
    }

    // Sanitize conversation history (max 6 turns, max 500 chars each)
    const sanitizedHistory = Array.isArray(rawHistory)
      ? rawHistory
        .filter(h => h && typeof h.content === 'string' && (h.role === 'user' || h.role === 'model' || h.role === 'assistant'))
        .slice(-6)
        .map(h => ({
          role: h.role === 'assistant' ? 'model' : h.role,
          content: h.content.slice(0, 500)
        }))
      : [];

    // Analyze conversation context across turns
    context = analyzeConversationContext(message, sanitizedHistory);

    // 3. Intent Detection & Contextual Defaults
    let userOrdersContext = null;
    let activeOffersContext = null;
    recommendedProducts = [];
    let productContext = '';

    const defaultConversationalText = generateContextualGuidance(context);

    // Check for "I don't know what is wrong, please help me"
    if (/i\s*don'?t\s*know\s*what\s*is\s*wrong|please\s*help\s*me|need\s*some\s*help/i.test(lowerMsg) && lowerMsg.length < 50) {
      return res.status(200).json({
        success: true,
        message: "I am here to help you. Could you share what you need assistance with — an existing order, a delivery update, choosing a rug for your home, or connecting with our support team?",
        products: []
      });
    }

    // Check for Official Shop Contact & Escalation
    const isContactQuery = /\bwhatsapp\b|how\s*can\s*i\s*contact|contact\s*(the\s*)?shop|contact\s*us|talk\s*to\s*(someone|human|person|support)|give\s*me\s*your\s*whatsapp|customer\s*(care|support)\s*(number|helpline|phone)|talk\s*to\s*customer\s*support|reach\s*(out\s*to\s*)?you/i.test(lowerMsg);
    if (isContactQuery) {
      return res.status(200).json({
        success: true,
        message: "You can connect directly with our Bhadohi atelier and concierge team through any of the following channels:\n\n• Primary WhatsApp & Phone: +91 7460007382\n• Secondary / Alternate Phone: +91 9839116625\n• Email: Potteryrugs@gmail.com\n• Atelier Address: G.T. Road, Ghosia, Aurai, Bhadohi 221301, U.P. (India)\n\nIf you have an order inquiry, damage report, or specific complaint, please let me know and I can also register an official support ticket for you right here.",
        products: []
      });
    }

    // Check for Support Ticket / Complaint Status Inquiry
    const isTicketStatusQuery = /show\s*(my\s*)?(complaints?|tickets?|support)|(what\s*is\s*my\s*|check\s*my\s*|track\s*my\s*)?(complaints?|tickets?|support(\s*case)?)\s*status|status\s*of\s*my\s*(complaint|ticket|case|support|request)|track\s*my\s*(complaint|ticket)|ticket\s*status|complaint\s*status|what'?s\s*(the\s*)?status\s*of\s*hlc-\d+|has\s*my\s*(support\s*ticket|complaint)\s*been\s*resolved/i.test(lowerMsg);
    if (isTicketStatusQuery) {
      const ticketIdMatch = lowerMsg.match(/hlc-\d+/i);
      if (ticketIdMatch) {
        const queryTicketId = ticketIdMatch[0].toUpperCase();
        const ticket = await SupportTicket.findOne({ ticketId: queryTicketId })
          .select('ticketId status category userId customerEmail')
          .lean();

        if (ticket) {
          // Security verification: if authenticated, verify ownership
          if (req.user && req.user._id) {
            const isOwner =
              (ticket.userId && ticket.userId.toString() === req.user._id.toString()) ||
              (ticket.customerEmail && ticket.customerEmail.toLowerCase() === req.user.email.toLowerCase());

            if (!isOwner) {
              return res.status(200).json({
                success: true,
                message: `Ticket ${queryTicketId} is registered under another account. For security, please sign in with the associated account or contact our support team.`,
                products: []
              });
            }
          }

          return res.status(200).json({
            success: true,
            message: `Your support ticket ${ticket.ticketId} is currently ${ticket.status}. Our support team is reviewing your request.`,
            products: []
          });
        } else {
          return res.status(200).json({
            success: true,
            message: `Support ticket ${queryTicketId} was not found. Please verify the ticket ID or check "My Complaints" in your account profile.`,
            products: []
          });
        }
      }

      if (!req.user || !req.user._id) {
        return res.status(200).json({
          success: true,
          message: "To track your support ticket or complaint, please sign in to your account, or provide your Ticket ID (e.g. HLC-1008).",
          products: []
        });
      }

      const tickets = await getCustomerTicketsInternal(req.user._id, req.user.email);
      if (tickets && tickets.length === 1) {
        const t = tickets[0];
        return res.status(200).json({
          success: true,
          message: `You have one active support ticket, ${t.ticketId}. It is currently ${t.status}. Our support team is reviewing your request.`,
          products: []
        });
      } else if (tickets && tickets.length > 1) {
        const ticketList = tickets
          .slice(0, 5)
          .map(t => `• ${t.ticketId} (${t.category}) — Status: ${t.status}`)
          .join('\n');
        return res.status(200).json({
          success: true,
          message: `You have ${tickets.length} support tickets on file:\n\n${ticketList}\n\nAsk about any ticket (e.g. "What is the status of ${tickets[0].ticketId}?") or view them under Profile → My Complaints.`,
          products: []
        });
      }

      return res.status(200).json({
        success: true,
        message: "You currently have no active support tickets on file. If you are experiencing an issue with an order or product, please describe what occurred and I will be pleased to register a ticket for you.",
        products: []
      });
    }

    // Check for short "I have a complaint" / "I want to complain" without details
    if (/^(i\s*(have|want\s*to\s*make|want\s*to\s*file|want\s*to\s*raise)\s*a\s*complaint|i\s*want\s*to\s*complain)$/i.test(lowerMsg.trim())) {
      return res.status(200).json({
        success: true,
        message: "I am here to assist you. Please describe what went wrong (for example: damaged product, wrong item delivered, payment deducted, or shipping delay), and I will register an official support ticket for you right away.",
        products: []
      });
    }

    // Check for Customer Problems, Complaints & Support Ticket Triggers
    const isDamagedQuery = /damage|damaged|broken|torn|cut|stain|soiled/i.test(lowerMsg);
    const isWrongProductQuery = /wrong\s*(product|item|rug|order)|incorrect\s*(product|item|rug|order)|different\s*(product|item)/i.test(lowerMsg);
    const isPaymentDeductedQuery = /payment\s*(was\s*)?deducted|money\s*(was\s*)?deducted|charged\s*twice|payment\s*failed\s*but/i.test(lowerMsg);
    const isDeliveryIssueQuery = /hasn'?t\s*arrived|not\s*arrived|not\s*delivered|delivered\s*but\s*i\s*didn'?t\s*receive|late\s*delivery/i.test(lowerMsg);
    const isCancelQuery = /want\s*to\s*cancel|cancel\s*(my\s*)?order|cancel\s*this\s*order/i.test(lowerMsg);
    const isReturnQuery = /want\s*to\s*return|return\s*(this\s*)?(product|order|rug)/i.test(lowerMsg);
    const isRefundQuery = /want\s*a\s*refund|process\s*my\s*refund|where\s*is\s*my\s*refund|get\s*a\s*refund/i.test(lowerMsg);
    const isDefectQuery = /defect|defective|faulty|flaw|imperfection/i.test(lowerMsg);
    const isGeneralComplaintQuery = /have\s*a\s*complaint|file\s*a\s*complaint|raise\s*a\s*complaint|problem\s*with\s*(my\s*)?order/i.test(lowerMsg);

    const isComplaintOrIssue = isDamagedQuery || isWrongProductQuery || isPaymentDeductedQuery ||
      isDeliveryIssueQuery || isCancelQuery || isReturnQuery || isRefundQuery || isDefectQuery || isGeneralComplaintQuery;

    if (isComplaintOrIssue) {
      // 1. Extract category & priority
      let category = 'General Enquiry';
      let priority = 'Normal';
      let resolutionAction = 'Our atelier support team will review your case and reach out shortly.';

      if (isDamagedQuery) {
        category = 'Damaged Product';
        priority = 'High';
        resolutionAction = 'Request and review damage photographs for replacement or restoration.';
      } else if (isWrongProductQuery) {
        category = 'Wrong Product';
        priority = 'High';
        resolutionAction = 'Dispatch correct item and arrange return courier for incorrect parcel.';
      } else if (isPaymentDeductedQuery) {
        category = 'Payment';
        priority = 'High';
        resolutionAction = 'Reconcile transaction status with Razorpay payment gateway and verify bank credit.';
      } else if (isDeliveryIssueQuery) {
        category = 'Delivery';
        priority = 'Normal';
        resolutionAction = 'Trace shipment with courier partner and provide updated delivery timeline.';
      } else if (isCancelQuery) {
        category = 'Cancellation';
        priority = 'Normal';
        resolutionAction = 'Verify dispatch status within 24-hour window and process order cancellation.';
      } else if (isReturnQuery) {
        category = 'Return';
        priority = 'Normal';
        resolutionAction = 'Inspect return eligibility under 7-day policy and provide reverse pickup details.';
      } else if (isRefundQuery) {
        category = 'Refund';
        priority = 'Normal';
        resolutionAction = 'Verify return delivery at Bhadohi atelier and initiate 5-7 day bank refund.';
      } else if (isDefectQuery) {
        category = 'Product';
        priority = 'Normal';
        resolutionAction = 'Evaluate handcraft characteristics and inspect defect photographs.';
      }

      // 2. Extract order number if mentioned
      const orderMatch = message.match(/#?([A-Za-z0-9\-]{5,20})/);
      let detectedOrderNum = '';
      if (orderMatch && !['damaged', 'payment', 'cancel', 'return', 'refund', 'complaint'].includes(orderMatch[1].toLowerCase())) {
        detectedOrderNum = orderMatch[1].replace(/#/g, '');
      }

      // If authenticated and no order found in text, grab their latest order
      if (!detectedOrderNum && req.user?._id) {
        const latestOrder = await Order.findOne({ userId: req.user._id }).sort({ createdAt: -1 }).select('orderNumber').lean();
        if (latestOrder) detectedOrderNum = latestOrder.orderNumber;
      }

      // 3. Create Support Ticket in MongoDB & dispatch non-blocking notifications
      const customerName = req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Valued Client' : 'Valued Client';
      const customerEmail = req.user?.email || 'client@houseofloomcraft.com';
      const customerPhone = req.user?.phone || '';

      const ticketResult = await createSupportTicketInternal({
        userId: req.user?._id || null,
        customerName,
        customerEmail,
        customerPhone,
        customerWhatsapp: customerPhone,
        orderNumber: detectedOrderNum,
        category,
        priority,
        subject: `${category} Request${detectedOrderNum ? ` — Order #${detectedOrderNum}` : ''}`,
        customerMessage: message,
        conversationContext: sanitizedHistory,
        aiSummary: `Customer submitted: "${message}"`,
        aiSuggestedResolution: resolutionAction
      });

      // 4. Construct empathetic, accurate conversational response
      let supportResponseText = '';

      if (isDamagedQuery) {
        supportResponseText = `I am truly sorry about that. I have registered an official support ticket for you so our atelier team can review this immediately.

Ticket ID: ${ticketResult.ticketId}
Category: Damaged Product
Status: Open

Please share a photo of the damaged area to Potteryrugs@gmail.com or via WhatsApp at +91 7460007382 quoting your Ticket ID. Our master craftsmen will inspect the case and guide you through a replacement or resolution.`;
      } else if (isWrongProductQuery) {
        supportResponseText = `I apologize for the shipment error. I have registered a support request to correct this for you.

Ticket ID: ${ticketResult.ticketId}
Category: Wrong Product
Status: Open

Please share a photograph of the piece you received to Potteryrugs@gmail.com or WhatsApp (+91 7460007382) with your Ticket ID. Our team will arrange the correct delivery and return of the incorrect parcel.`;
      } else if (isPaymentDeductedQuery) {
        supportResponseText = `I understand your payment was deducted. I have registered an urgent review ticket with our billing desk.

Ticket ID: ${ticketResult.ticketId}
Category: Payment (High Priority)
Status: Open

Our finance desk will reconcile this with our Razorpay records. If an order was not created, the amount will be linked or automatically credited back by your issuing bank within 3–5 business days.`;
      } else if (isDeliveryIssueQuery) {
        supportResponseText = `I regret to hear about the delivery issue. I have registered a support ticket to trace your parcel with our logistics team.

Ticket ID: ${ticketResult.ticketId}
Category: Delivery
Status: Open

Our dispatch desk will trace the carrier status and contact you with an updated delivery timeline.`;
      } else if (isCancelQuery) {
        supportResponseText = `Under our atelier policy, orders may be cancelled within 24 hours of placement before dispatch. I have registered your cancellation request.

Ticket ID: ${ticketResult.ticketId}
Category: Cancellation
Status: Open

Our team will verify the dispatch status of your piece and confirm cancellation shortly.`;
      } else if (isReturnQuery) {
        supportResponseText = `We accept returns within 7 days of delivery for defective or damaged pieces with photographic proof. I have registered your return request.

Ticket ID: ${ticketResult.ticketId}
Category: Return
Status: Open

Our team will review your inquiry and follow up with reverse-pickup guidance.`;
      } else if (isRefundQuery) {
        supportResponseText = `Refunds for returned pieces are credited to your original payment method within 5–7 business days following inspection at our Bhadohi atelier. I have registered your refund inquiry.

Ticket ID: ${ticketResult.ticketId}
Category: Refund
Status: Open

Our accounts desk will verify your order details and update you.`;
      } else {
        supportResponseText = `Your support request has been registered successfully.

Ticket ID: ${ticketResult.ticketId}
Status: Open

Our support team will review the issue and get back to you promptly.`;
      }

      return res.status(200).json({
        success: true,
        message: supportResponseText,
        products: []
      });
    }

    // Check for Order tracking and Order details intent
    const isOrderQuery = /order|track|shipment|where is my|delivery status|my package|when will my order arrive|show my order/i.test(lowerMsg);
    if (isOrderQuery) {
      if (!req.user || !req.user._id) {
        return res.status(200).json({
          success: true,
          message: 'To review your order details, tracking information, and delivery updates, please sign in to your House of Loom & Craft account. Once signed in, I will be pleased to fetch your live atelier orders.',
          products: []
        });
      }

      // Check if specific order number is provided (e.g. "Track order #HLC10245" or "Show order #1045")
      const orderNumMatch = message.match(/#?([A-Za-z0-9\-]{5,20})/);
      const isSpecificOrder = orderNumMatch && !['order', 'orders', 'track', 'where', 'details'].includes(orderNumMatch[1].toLowerCase());

      if (isSpecificOrder) {
        const specificOrder = await getOrderDetailsInternal(req.user._id, orderNumMatch[1]);
        if (specificOrder) {
          return res.status(200).json({
            success: true,
            message: `Here are the details for Order #${specificOrder.orderNumber}:

• Status: ${specificOrder.status.toUpperCase()}
• Date: ${specificOrder.date}
• Items: ${specificOrder.items}
• Total: ${specificOrder.total}
• Carrier: ${specificOrder.carrier}
• Tracking: ${specificOrder.trackingNumber}`,
            products: []
          });
        } else {
          return res.status(200).json({
            success: true,
            message: `I could not locate an order matching "${orderNumMatch[1]}" under your account. Please verify the order number or ask me to list your recent orders.`,
            products: []
          });
        }
      }

      // General order list
      const orders = await getCustomerOrdersInternal(req.user._id);
      if (orders && orders.length > 0) {
        const ordersListFormatted = orders.map(o => `• Order #${o.orderNumber} (${o.date}) — Status: ${o.status.toUpperCase()} | Total: ${o.total}\n  Items: ${o.items}\n  Tracking: ${o.trackingNumber}`).join('\n\n');
        return res.status(200).json({
          success: true,
          message: `Here are your recent House of Loom & Craft orders:\n\n${ordersListFormatted}\n\nLet me know if you would like more details or assistance with any specific order.`,
          products: []
        });
      } else {
        return res.status(200).json({
          success: true,
          message: "You currently have no previous orders recorded under your account. When you place an order, live tracking and details will appear here.",
          products: []
        });
      }
    }

    // Check for Offers / Discounts intent
    const isOfferQuery = /offer|discount|coupon|promo|sale|deal|save|code/i.test(lowerMsg);
    if (isOfferQuery) {
      try {
        const now = new Date();
        const offers = await Promise.race([
          Offer.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
          })
            .select('code name discountType discountValue minOrderValue maxDiscount')
            .limit(5)
            .lean(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('DB_TIMEOUT')), 2000))
        ]);

        if (offers && offers.length > 0) {
          activeOffersContext = offers.map(off => ({
            code: off.code,
            name: off.name,
            discount: off.discountType === 'percentage' ? `${off.discountValue}% OFF` : `₹${off.discountValue} OFF`,
            minOrder: off.minOrderValue ? `₹${off.minOrderValue.toLocaleString('en-IN')}` : 'No minimum',
            maxCap: off.maxDiscount ? `Up to ₹${off.maxDiscount.toLocaleString('en-IN')}` : null
          }));
        } else {
          activeOffersContext = 'There are currently no active public promotional discount codes available. All pieces are offered at direct atelier manufacturer pricing.';
        }
      } catch (err) {
        console.warn('[Chatbot Offer Query Timeout/Error]:', err.message);
        activeOffersContext = 'All pieces are offered at direct atelier manufacturer pricing with complimentary insured nationwide shipping.';
      }
    }

    // 4. Intent-Aware Product Retrieval
    // Do NOT show products if dimensions were provided without prior context (Flow E)
    if (!context.isDimensionWithoutContext && (context.isRug || context.isDecor)) {
      const catalog = await getCatalogProducts();

      if (catalog && catalog.length > 0) {
        // Strict category gating: never recommend home decor products when looking for rugs
        let candidates = [];
        if (context.isRug) {
          candidates = catalog.filter(isRugProduct);
        } else if (context.isDecor) {
          candidates = catalog.filter(isDecorProduct);
        } else {
          candidates = catalog;
        }

        if (candidates.length > 0) {
          const budget = extractBudget(message);
          const keywords = extractSearchKeywords(message);

          let scored = candidates.map(p => {
            let score = 0;
            const pName = (p.name || '').toLowerCase();
            const pDesc = (p.shortDescription || p.description || '').toLowerCase();
            const pMat = (p.material || '').toLowerCase();
            const pCol = (p.collectionName || p.category || '').toLowerCase();
            const pSlug = (p.slug || '').toLowerCase();

            if (budget && p.price && p.price <= budget) score += 3;
            if (keywords) {
              keywords.split(' ').forEach(kw => {
                if (kw && (pName.includes(kw) || pDesc.includes(kw) || pMat.includes(kw) || pCol.includes(kw))) {
                  score += 2;
                }
              });
            }

            // Custom rug intent
            if (context.isCustom) {
              if (pSlug.includes('bespoke') || pName.includes('bespoke') || pName.includes('custom')) {
                score += 10;
              } else {
                score += 1;
              }
            }

            // Bedroom rug intent: prioritize handloom, plush tufted, or bespoke
            if (context.room === 'bedroom') {
              if (pCol.includes('handloom') || pName.includes('handloom') || pMat.includes('wool') || pMat.includes('silk')) score += 6;
              if (pCol.includes('tufted') || pName.includes('tufted')) score += 4;
              if (pSlug.includes('bespoke')) score += 3;
              score += 1;
            }

            // Living room rug intent: prioritize hand knotted, sculpted tufted
            if (context.room === 'living_room') {
              if (pCol.includes('knotted') || pName.includes('knotted')) score += 6;
              if (pCol.includes('tufted') || pName.includes('tufted')) score += 4;
              score += 1;
            }

            // Dining room rug intent
            if (context.room === 'dining_room') {
              if (pCol.includes('woven') || pCol.includes('flatweave') || pCol.includes('knotted')) score += 6;
              score += 1;
            }

            // "what rugs do you have?" intent: broad representation
            if (context.isWhatRugs) {
              score += 3;
            }

            // General rug query
            if (context.isRug && !context.room && !context.isCustom && !context.isWhatRugs) {
              score += 2;
            }

            return { product: p, score };
          });

          // Only keep positive score matches - never recommend arbitrary products
          scored = scored.filter(s => s.score > 0);
          scored.sort((a, b) => b.score - a.score);

          const topPicks = scored.slice(0, 3).map(s => s.product);
          if (topPicks.length > 0) {
            recommendedProducts = topPicks;
            const contextPromises = topPicks.map(async (p) => {
              const convertedPrice = customerCurrency !== 'INR' ? await convertFromINR(p.price, customerCurrency) : p.price;
              const displayPriceStr = customerCurrency !== 'INR' 
                ? `${customerCurrency} ${convertedPrice?.toLocaleString()} (Base: ₹${p.price?.toLocaleString('en-IN')})`
                : `₹${p.price?.toLocaleString('en-IN')}`;
              return `- ${p.name} (Price: ${displayPriceStr}, Collection: ${p.collectionName || p.category}, Dimensions: ${p.dimensions || 'Customizable'})`;
            });
            const formattedContextLines = await Promise.all(contextPromises);
            productContext = formattedContextLines.join('\n');
          }
        }
      }
    }

    // 5. Gemini System Prompt & Execution
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('[Chatbot Warning] GEMINI_API_KEY is not configured in backend environment.');
      return res.status(200).json({
        success: true,
        message: defaultConversationalText,
        products: recommendedProducts
      });
    }

    const systemInstruction = `
You are the "House of Loom & Craft Concierge", the official luxury interior and rug specialist for "House of Loom & Craft" (Bhadohi, India).

CORE RESPONSE GUIDELINES:
- Output ONLY the final conversational message to the customer.
- NEVER output internal reasoning, thought process, or catalog checks (NEVER write "exists in catalog", "Let's showcase...").
- Keep your response to 2-3 complete, warm, elegant sentences.
- ALWAYS finish your thoughts and end with proper sentence-ending punctuation (. or ?). NEVER stop mid-sentence.
- DO NOT list product links, markdown URLs, or raw product specs in your text. The frontend UI automatically renders the curated product cards below your message.

CONVERSATION CONTINUITY & CONTEXT INHERITANCE:
- You MUST maintain context from previous conversation turns.
- If the user previously mentioned a room (e.g., bedroom, living room, dining area) and now provides dimensions (e.g., "10 by 12 feet", "8x10"):
  * Immediately recognize those dimensions as applying to that previously specified room!
  * Recommend appropriate rug sizing and furniture placement for that room. For example:
    - For a 10 × 12 ft bedroom: recommend an 8 × 10 ft rug positioned beneath the lower two-thirds of the bed (or a 6 × 9 ft rug for more perimeter floor exposure).
    - For a 10 × 12 ft living room: recommend an 8 × 10 ft rug to anchor the seating area with front sofa legs resting on the rug.
  * NEVER ask the customer to repeat information they already provided in the immediately preceding conversation.
- If the user provides dimensions with NO prior context at all (Flow E), ask what room or furniture arrangement the dimensions are for rather than guessing.
- For custom/bespoke rug inquiries ("I wanna custom rug"), warmly explain that we craft bespoke scales, custom pantone dyes, and unique pile profiles, and invite them to share dimensions, colours, and style ideas.

CURRENT CONVERSATION STATE:
- Active Room: ${context.room ? context.room.replace('_', ' ') : 'Not specified'}
- Focus Area: ${context.isRug ? 'Handcrafted Rugs & Carpets' : context.isDecor ? 'Home Decor & Accents' : 'General Concierge'}
- Customer Selected Currency: ${customerCurrency}
${context.isCustom ? '- Custom / Bespoke Rug Commission: Requested' : ''}
${context.hasDimension ? `- Dimensions Stated: ${context.dimensionString || 'Yes'}` : ''}

PRICING & CURRENCY GUIDELINE:
- The customer is browsing in ${customerCurrency}.
- If the customer asks about price (e.g. "how much is this rug?"), quote the display price using the exact figures from CURATED PIECES DISPLAYED IN UI (${customerCurrency}). Never invent exchange rates or fabrications.

FACTUAL GROUNDING:
${ATELIER_FACTS}

${userOrdersContext ? `CUSTOMER'S ORDERS:\n${JSON.stringify(userOrdersContext, null, 2)}` : ''}
${activeOffersContext ? `STORE OFFERS:\n${JSON.stringify(activeOffersContext, null, 2)}` : ''}
${productContext ? `CURATED PIECES DISPLAYED IN UI:\n${productContext}` : ''}
`;

    const ai = new GoogleGenAI({ apiKey });

    // Prepare contents with conversation history, strictly enforcing alternating user/model sequence starting with user
    const contents = [];
    let lastRole = null;

    for (const h of sanitizedHistory) {
      const currentRole = h.role === 'model' ? 'model' : 'user';
      if (contents.length === 0 && currentRole === 'model') {
        continue;
      }
      if (currentRole === lastRole) {
        contents[contents.length - 1].parts[0].text += `\n${h.content}`;
      } else {
        contents.push({
          role: currentRole,
          parts: [{ text: h.content }]
        });
        lastRole = currentRole;
      }
    }

    if (lastRole === 'user' && contents.length > 0) {
      contents[contents.length - 1].parts[0].text += `\n${message}`;
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });
    }

    // Execute Gemini call with 25-second timeout protection and 800 token headroom
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('GEMINI_TIMEOUT')), 25000)
    );

    const geminiPromise = ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction,
        temperature: 0.6,
        maxOutputTokens: 800
      }
    });

    const response = await Promise.race([geminiPromise, timeoutPromise]);
    let rawResponseText = response.text ? response.text.trim() : '';

    const validatedMessage = sanitizeAndValidateText(rawResponseText, defaultConversationalText);

    return res.status(200).json({
      success: true,
      message: validatedMessage,
      products: recommendedProducts.map(p => ({
        id: p._id || p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        thumbnail: p.thumbnail || p.images?.[0] || '',
        badge: p.badge || '',
        collectionName: p.collectionName || p.category,
        dimensions: p.dimensions,
        stock: p.stock
      }))
    });

  } catch (error) {
    console.error('[House of Loom & Craft Concierge Notice]:', error.message || error);

    // Contextual, complete conversational fallback using the analyzed conversation state
    const fallbackMsg = generateContextualGuidance(context);

    return res.status(200).json({
      success: true,
      message: fallbackMsg,
      products: (recommendedProducts || []).map(p => ({
        id: p._id || p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        thumbnail: p.thumbnail || p.images?.[0] || '',
        badge: p.badge || '',
        collectionName: p.collectionName || p.category,
        dimensions: p.dimensions,
        stock: p.stock
      }))
    });
  }
};
