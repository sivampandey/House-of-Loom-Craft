import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { Offer } from '../models/Offer.js';
import { restoreOrderStockSafely } from './orderController.js';

// ==================== DASHBOARD OVERVIEW ====================
export const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();

    // 1. Order counts
    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalCustomers,
      totalProducts,
      lowStockCount,
      activeOffersCount
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: { $in: ['pending', 'confirmed', 'processing'] } }),
      Order.countDocuments({ orderStatus: 'delivered' }),
      Order.countDocuments({ orderStatus: 'cancelled' }),
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments(),
      Product.countDocuments({ stock: { $lte: 5 } }),
      Offer.countDocuments({ isActive: true, endDate: { $gte: now } })
    ]);

    // 2. Revenue aggregation (only counting completed orders or valid non-cancelled orders)
    const revenueAgg = await Order.aggregate([
      {
        $match: {
          orderStatus: { $ne: 'cancelled' },
          paymentStatus: { $in: ['completed', 'pending'] } // Includes confirmed COD & paid online
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' }
        }
      }
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

    // 3. Recent Orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('userId', 'firstName lastName email');

    // 4. Low Stock Products list
    const lowStockProducts = await Product.find({ stock: { $lte: 5 } })
      .select('name slug stock price thumbnail images category collectionName isActive')
      .limit(6);

    res.status(200).json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        totalCustomers,
        totalProducts,
        lowStockCount,
        activeOffersCount
      },
      recentOrders,
      lowStockProducts
    });
  } catch (error) {
    next(error);
  }
};

// ==================== PRODUCTS MANAGEMENT ====================
export const getAllProductsAdmin = async (req, res, next) => {
  try {
    const {
      search,
      category,
      collection,
      stockStatus,
      status, // 'active', 'inactive', 'all'
      sort = 'newest',
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    // Active status filter
    if (status === 'active') query.isActive = true;
    else if (status === 'inactive') query.isActive = false;

    // Category & Collection
    if (category && category !== 'all') {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }
    if (collection && collection !== 'all') {
      query.collection = collection;
    }

    // Stock Status
    if (stockStatus === 'out_of_stock') {
      query.stock = { $lte: 0 };
    } else if (stockStatus === 'low_stock') {
      query.stock = { $gt: 0, $lte: 5 };
    } else if (stockStatus === 'in_stock') {
      query.stock = { $gt: 5 };
    }

    // Search query
    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { slug: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { material: { $regex: q, $options: 'i' } }
      ];
    }

    // Sorting
    let sortOptions = { createdAt: -1 };
    if (sort === 'oldest') sortOptions = { createdAt: 1 };
    else if (sort === 'price_asc') sortOptions = { price: 1 };
    else if (sort === 'price_desc') sortOptions = { price: -1 };
    else if (sort === 'stock_asc') sortOptions = { stock: 1 };
    else if (sort === 'stock_desc') sortOptions = { stock: -1 };
    else if (sort === 'name_asc') sortOptions = { name: 1 };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      products
    });
  } catch (error) {
    next(error);
  }
};

export const getProductAdminById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

export const createProductAdmin = async (req, res, next) => {
  try {
    const data = { ...req.body };

    if (!data.name || !data.price || !data.category) {
      return res.status(400).json({
        success: false,
        message: 'Product name, price, and category are required.'
      });
    }

    // Slug generation or validation
    if (!data.slug || !data.slug.trim()) {
      data.slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    } else {
      data.slug = data.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    }

    // Ensure slug is unique
    let existingSlug = await Product.findOne({ slug: data.slug });
    if (existingSlug) {
      data.slug = `${data.slug}-${Date.now().toString().slice(-4)}`;
    }

    // Ensure images array has thumbnail
    if (Array.isArray(data.images) && data.images.length > 0 && !data.thumbnail) {
      data.thumbnail = data.images[0];
    }

    if (!data.collection) {
      data.collection = data.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    const product = await Product.create(data);
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    next(error);
  }
};

export const updateProductAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };

    // If slug is provided, check collision
    if (data.slug) {
      data.slug = data.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
      const conflict = await Product.findOne({ slug: data.slug, _id: { $ne: id } });
      if (conflict) {
        return res.status(400).json({
          success: false,
          message: 'A product with this URL slug already exists. Please choose a distinct slug.'
        });
      }
    }

    // Set thumbnail to first image if images exists
    if (Array.isArray(data.images) && data.images.length > 0 && !data.thumbnail) {
      data.thumbnail = data.images[0];
    }

    const product = await Product.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProductAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Safe soft-delete check: Does this product exist in historical orders?
    const orderWithProduct = await Order.findOne({ 'items.productId': id });
    if (orderWithProduct) {
      // Soft-delete to preserve historical order records
      product.isActive = false;
      await product.save();
      return res.status(200).json({
        success: true,
        message: 'Product is referenced in historical customer orders and has been safely unpublished (set to inactive) to preserve order history.',
        softDeleted: true
      });
    }

    // If no order history, permanently delete
    await Product.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: 'Product permanently removed from database.',
      softDeleted: false
    });
  } catch (error) {
    next(error);
  }
};

// ==================== USER MANAGEMENT ====================
export const getAllUsersAdmin = async (req, res, next) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;

    const query = {};
    if (role && role !== 'all') {
      query.role = role;
    }

    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-passwordHash -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Aggregate orders summary for these users
    const userIds = users.map(u => u._id);
    const orderStats = await Order.aggregate([
      { $match: { userId: { $in: userIds } } },
      {
        $group: {
          _id: '$userId',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' }
        }
      }
    ]);

    const statsMap = {};
    orderStats.forEach(stat => {
      statsMap[stat._id.toString()] = {
        totalOrders: stat.totalOrders,
        totalSpent: stat.totalSpent
      };
    });

    const enrichedUsers = users.map(u => {
      const userObj = u.toObject();
      const st = statsMap[u._id.toString()] || { totalOrders: 0, totalSpent: 0 };
      return {
        ...userObj,
        totalOrders: st.totalOrders,
        totalSpent: st.totalSpent
      };
    });

    res.status(200).json({
      success: true,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      users: enrichedUsers
    });
  } catch (error) {
    next(error);
  }
};

export const getUserAdminById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const orders = await Order.find({ userId: user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      user,
      orders
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUserAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Security check: cannot delete self
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: 'Security Violation: You cannot delete your own active administrator account.'
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 2. Security check: cannot delete the last remaining admin
    if (targetUser.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Security Violation: Cannot delete the sole administrator account.'
        });
      }
    }

    // 3. Check for existing order history
    const userOrdersCount = await Order.countDocuments({ userId: id });
    if (userOrdersCount > 0) {
      // Anonymize user instead of deleting so historical order references remain valid
      targetUser.firstName = 'Deactivated';
      targetUser.lastName = 'Customer';
      targetUser.email = `deactivated_${id}@potteryrugs.local`;
      targetUser.phone = '';
      targetUser.addresses = [];
      await targetUser.save();

      return res.status(200).json({
        success: true,
        message: 'Customer has historical orders. Account has been safely deactivated and anonymized to preserve order integrity.'
      });
    }

    await User.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: 'Customer account successfully removed.'
    });
  } catch (error) {
    next(error);
  }
};

// ==================== ORDER MANAGEMENT ====================
export const getAllOrdersAdmin = async (req, res, next) => {
  try {
    const {
      search,
      orderStatus,
      paymentStatus,
      paymentMethod,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    if (orderStatus && orderStatus !== 'all') {
      query.orderStatus = orderStatus;
    }
    if (paymentStatus && paymentStatus !== 'all') {
      query.paymentStatus = paymentStatus;
    }
    if (paymentMethod && paymentMethod !== 'all') {
      query.paymentMethod = paymentMethod;
    }

    // Date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Search by orderNumber or customer details
    if (search && search.trim()) {
      const q = search.trim();
      const matchingUsers = await User.find({
        $or: [
          { firstName: { $regex: q, $options: 'i' } },
          { lastName: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } }
        ]
      }).select('_id');

      const userIds = matchingUsers.map(u => u._id);

      query.$or = [
        { orderNumber: { $regex: q, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: q, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: q, $options: 'i' } },
        { userId: { $in: userIds } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('userId', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      orders
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderAdminById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = {
      $or: [
        { orderNumber: id },
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }
      ]
    };

    const order = await Order.findOne(query).populate('userId', 'firstName lastName email phone addresses');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatusAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { orderStatus, note } = req.body;

    const allowed = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!allowed.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid order status. Allowed: ${allowed.join(', ')}`
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const previousStatus = order.orderStatus;

    // Stock management: if cancelling now, restore stock
    if (orderStatus === 'cancelled' && previousStatus !== 'cancelled') {
      await restoreOrderStockSafely(order);
    }

    order.orderStatus = orderStatus;
    order.statusHistory.push({
      status: orderStatus,
      timestamp: new Date(),
      note: note || `Status transitioned from ${previousStatus} to ${orderStatus} by atelier administrator.`
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: `Order status updated to ${orderStatus}`,
      order
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderTrackingAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { trackingNumber, carrier, shippingNote } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber.trim();
    if (carrier !== undefined) order.carrier = carrier.trim();
    if (shippingNote !== undefined) order.shippingNote = shippingNote.trim();

    order.statusHistory.push({
      status: order.orderStatus,
      timestamp: new Date(),
      note: `Shipment tracking updated: Carrier=${order.carrier || 'N/A'}, Tracking=${order.trackingNumber || 'N/A'}`
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Shipment tracking information updated successfully.',
      order
    });
  } catch (error) {
    next(error);
  }
};
