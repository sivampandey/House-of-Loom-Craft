import { Offer } from '../models/Offer.js';

// ==================== CUSTOMER COUPON VALIDATION ====================
export const validateOffer = async (req, res, next) => {
  try {
    const { code, subtotal, items = [] } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({
        valid: false,
        message: 'Please enter a coupon code.'
      });
    }

    const cleanCode = code.trim().toUpperCase();
    const offer = await Offer.findOne({ code: cleanCode });

    if (!offer) {
      return res.status(404).json({
        valid: false,
        message: `Coupon code "${cleanCode}" is invalid.`
      });
    }

    if (!offer.isActive) {
      return res.status(400).json({
        valid: false,
        message: `Coupon "${cleanCode}" is no longer active.`
      });
    }

    const now = new Date();
    if (offer.startDate && now < offer.startDate) {
      return res.status(400).json({
        valid: false,
        message: `Coupon "${cleanCode}" is not yet active.`
      });
    }

    if (offer.endDate && now > offer.endDate) {
      return res.status(400).json({
        valid: false,
        message: `Coupon "${cleanCode}" has expired.`
      });
    }

    // Global usage limit
    if (offer.usageLimit !== null && offer.usedCount >= offer.usageLimit) {
      return res.status(400).json({
        valid: false,
        message: `Coupon "${cleanCode}" has reached its maximum usage limit.`
      });
    }

    // Per-customer usage limit (if user is authenticated)
    if (req.user && req.user._id) {
      const userUsageCount = offer.usedBy.filter(u => u.userId && u.userId.toString() === req.user._id.toString()).length;
      if (userUsageCount >= (offer.perCustomerLimit || 1)) {
        return res.status(400).json({
          valid: false,
          message: `You have already redeemed coupon "${cleanCode}" the maximum allowed times (${offer.perCustomerLimit || 1}).`
        });
      }
    }

    const parsedSubtotal = Number(subtotal) || 0;

    // Minimum order value check
    if (offer.minOrderValue && parsedSubtotal < offer.minOrderValue) {
      return res.status(400).json({
        valid: false,
        message: `Coupon "${cleanCode}" requires a minimum order value of ₹${offer.minOrderValue.toLocaleString('en-IN')}. (Current: ₹${parsedSubtotal.toLocaleString('en-IN')})`
      });
    }

    // Category eligibility check if specified
    if (offer.applicableCategories && offer.applicableCategories.length > 0) {
      const hasEligibleItem = items.some(item =>
        offer.applicableCategories.some(cat =>
          cat.toLowerCase() === (item.category || '').toLowerCase()
        )
      );
      if (!hasEligibleItem) {
        return res.status(400).json({
          valid: false,
          message: `Coupon "${cleanCode}" is applicable only for: ${offer.applicableCategories.join(', ')}.`
        });
      }
    }

    // Authoritative Server-side discount calculation
    let calculatedDiscount = 0;
    if (offer.discountType === 'percentage') {
      calculatedDiscount = Math.round((parsedSubtotal * offer.discountValue) / 100);
      if (offer.maxDiscount && calculatedDiscount > offer.maxDiscount) {
        calculatedDiscount = offer.maxDiscount;
      }
    } else if (offer.discountType === 'fixed') {
      calculatedDiscount = Math.min(offer.discountValue, parsedSubtotal);
    }

    calculatedDiscount = Math.max(0, calculatedDiscount);
    const finalTotal = Math.max(0, parsedSubtotal - calculatedDiscount);

    res.status(200).json({
      valid: true,
      code: offer.code,
      name: offer.name,
      discountType: offer.discountType,
      discountValue: offer.discountValue,
      discountAmount: calculatedDiscount,
      finalTotal,
      message: `Coupon "${offer.code}" applied! Saved ₹${calculatedDiscount.toLocaleString('en-IN')}.`
    });
  } catch (error) {
    next(error);
  }
};

// ==================== ADMIN OFFERS CRUD ====================
export const getAllOffersAdmin = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status === 'active') query.isActive = true;
    else if (status === 'inactive') query.isActive = false;

    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { code: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Offer.countDocuments(query);
    const offers = await Offer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      offers
    });
  } catch (error) {
    next(error);
  }
};

export const getOfferAdminById = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }
    res.status(200).json({ success: true, offer });
  } catch (error) {
    next(error);
  }
};

export const createOfferAdmin = async (req, res, next) => {
  try {
    const data = { ...req.body };

    if (!data.name || !data.code || !data.discountValue || !data.endDate) {
      return res.status(400).json({
        success: false,
        message: 'Name, code, discount value, and expiration date are required.'
      });
    }

    data.code = data.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');

    const existing = await Offer.findOne({ code: data.code });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `An offer with code "${data.code}" already exists.`
      });
    }

    const offer = await Offer.create(data);
    res.status(201).json({
      success: true,
      message: 'Offer created successfully',
      offer
    });
  } catch (error) {
    next(error);
  }
};

export const updateOfferAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };

    if (data.code) {
      data.code = data.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
      const conflict = await Offer.findOne({ code: data.code, _id: { $ne: id } });
      if (conflict) {
        return res.status(400).json({
          success: false,
          message: `Another offer with code "${data.code}" already exists.`
        });
      }
    }

    const offer = await Offer.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true
    });

    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Offer updated successfully',
      offer
    });
  } catch (error) {
    next(error);
  }
};

export const deleteOfferAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    const offer = await Offer.findById(id);
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    // If offer was already redeemed by customers, soft-delete it by setting isActive: false
    if (offer.usedCount > 0) {
      offer.isActive = false;
      await offer.save();
      return res.status(200).json({
        success: true,
        message: 'Offer has redemption history and has been deactivated to preserve records.',
        softDeleted: true
      });
    }

    await Offer.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: 'Offer deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
