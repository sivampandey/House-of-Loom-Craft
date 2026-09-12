import { User } from '../models/User.js';
import { Product } from '../models/Product.js';

export const getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'wishlist',
      match: { isActive: true },
      select: 'name slug price compareAtPrice dimensions material images thumbnail collection collectionName badge inStock leadTime'
    });

    res.status(200).json({
      success: true,
      wishlist: user.wishlist || []
    });
  } catch (error) {
    next(error);
  }
};

export const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const product = await Product.findOne({
      $or: [{ _id: productId.match(/^[0-9a-fA-F]{24}$/) ? productId : null }, { slug: productId }],
      isActive: true
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const user = await User.findById(req.user._id);

    const exists = user.wishlist.some(id => id.toString() === product._id.toString());
    if (!exists) {
      user.wishlist.push(product._id);
      await user.save();
    }

    const populatedUser = await User.findById(req.user._id).populate({
      path: 'wishlist',
      match: { isActive: true },
      select: 'name slug price compareAtPrice dimensions material images thumbnail collection collectionName badge inStock leadTime'
    });

    res.status(200).json({
      success: true,
      message: `${product.name} added to your saved pieces.`,
      wishlist: populatedUser.wishlist
    });
  } catch (error) {
    next(error);
  }
};

export const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const product = await Product.findOne({
      $or: [{ _id: productId.match(/^[0-9a-fA-F]{24}$/) ? productId : null }, { slug: productId }]
    });

    const targetId = product ? product._id.toString() : productId;

    const user = await User.findById(req.user._id);
    user.wishlist = user.wishlist.filter(id => id.toString() !== targetId);
    await user.save();

    const populatedUser = await User.findById(req.user._id).populate({
      path: 'wishlist',
      match: { isActive: true },
      select: 'name slug price compareAtPrice dimensions material images thumbnail collection collectionName badge inStock leadTime'
    });

    res.status(200).json({
      success: true,
      message: 'Piece removed from your saved collection.',
      wishlist: populatedUser.wishlist
    });
  } catch (error) {
    next(error);
  }
};

export const syncWishlist = async (req, res, next) => {
  try {
    const { guestWishlist = [] } = req.body;

    const user = await User.findById(req.user._id);

    for (const item of guestWishlist) {
      const product = await Product.findOne({
        $or: [
          { _id: item._id && item._id.match(/^[0-9a-fA-F]{24}$/) ? item._id : null },
          { slug: item.id || item.slug }
        ],
        isActive: true
      });

      if (product) {
        const exists = user.wishlist.some(id => id.toString() === product._id.toString());
        if (!exists) {
          user.wishlist.push(product._id);
        }
      }
    }

    await user.save();

    const populatedUser = await User.findById(req.user._id).populate({
      path: 'wishlist',
      match: { isActive: true },
      select: 'name slug price compareAtPrice dimensions material images thumbnail collection collectionName badge inStock leadTime'
    });

    res.status(200).json({
      success: true,
      message: 'Saved pieces synchronized.',
      wishlist: populatedUser.wishlist
    });
  } catch (error) {
    next(error);
  }
};
