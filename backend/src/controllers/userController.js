import { User } from '../models/User.js';
import { Order } from '../models/Order.js';

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    const orderCount = await Order.countDocuments({ userId: req.user._id });

    res.status(200).json({
      success: true,
      user,
      stats: {
        totalOrders: orderCount,
        addressCount: user.addresses.length,
        wishlistCount: user.wishlist.length
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, avatar } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (firstName) user.firstName = firstName.trim();
    if (lastName) user.lastName = lastName.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile details updated successfully.',
      user
    });
  } catch (error) {
    next(error);
  }
};

export const getAddresses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      addresses: user.addresses || []
    });
  } catch (error) {
    next(error);
  }
};

export const addAddress = async (req, res, next) => {
  try {
    const { fullName, phone, addressLine1, addressLine2, city, state, postalCode, country, landmark, isDefault } = req.body;

    if (!fullName || !phone || !addressLine1 || !city || !state || !postalCode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all mandatory address fields.'
      });
    }

    const user = await User.findById(req.user._id);

    // If first address or isDefault is true, ensure it is the default
    const shouldBeDefault = Boolean(isDefault) || user.addresses.length === 0;

    if (shouldBeDefault) {
      user.addresses.forEach(addr => { addr.isDefault = false; });
    }

    user.addresses.push({
      fullName: fullName.trim(),
      phone: phone.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: (addressLine2 || '').trim(),
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
      country: (country || 'India').trim(),
      landmark: (landmark || '').trim(),
      isDefault: shouldBeDefault
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'New address added to atelier profile.',
      addresses: user.addresses
    });
  } catch (error) {
    next(error);
  }
};

export const updateAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const { fullName, phone, addressLine1, addressLine2, city, state, postalCode, country, landmark, isDefault } = req.body;

    const user = await User.findById(req.user._id);
    const address = user.addresses.id(addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found in your atelier account.'
      });
    }

    if (isDefault) {
      user.addresses.forEach(addr => { addr.isDefault = false; });
      address.isDefault = true;
    }

    if (fullName) address.fullName = fullName.trim();
    if (phone) address.phone = phone.trim();
    if (addressLine1) address.addressLine1 = addressLine1.trim();
    if (addressLine2 !== undefined) address.addressLine2 = addressLine2.trim();
    if (city) address.city = city.trim();
    if (state) address.state = state.trim();
    if (postalCode) address.postalCode = postalCode.trim();
    if (country) address.country = country.trim();
    if (landmark !== undefined) address.landmark = landmark.trim();

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address updated successfully.',
      addresses: user.addresses
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user._id);

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found.'
      });
    }

    const wasDefault = address.isDefault;
    user.addresses.pull({ _id: addressId });

    // If deleted address was default, make the first remaining address default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address removed from your profile.',
      addresses: user.addresses
    });
  } catch (error) {
    next(error);
  }
};

export const setDefaultAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user._id);

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found.'
      });
    }

    user.addresses.forEach(addr => {
      addr.isDefault = addr._id.toString() === addressId;
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Default delivery address updated.',
      addresses: user.addresses
    });
  } catch (error) {
    next(error);
  }
};
