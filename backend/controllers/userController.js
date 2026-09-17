const User = require('../models/User');
const Booking = require('../models/Booking');

exports.getUsers = async (req, res) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Math.min(100, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: users.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      users,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const bookings = await Booking.find({ user: user._id })
      .populate('camera', 'name brand model images')
      .sort({ createdAt: -1 });

    res.json({ success: true, user, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, phone, address, role, isBlocked } = req.body;

    if (role !== undefined) {
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({ success: false, message: 'Only super admin can change user roles' });
      }

      if (!['user', 'admin', 'super_admin'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
      }

      if (user._id.toString() === req.user._id.toString() && role !== 'super_admin') {
        return res.status(400).json({ success: false, message: 'You cannot change your own super admin role' });
      }

      if (role === 'user' && user.role === 'super_admin') {
        const remainingSuperAdminCount = await User.countDocuments({
          role: 'super_admin',
          _id: { $ne: user._id },
        });

        if (remainingSuperAdminCount === 0) {
          return res.status(400).json({
            success: false,
            message: 'At least one super admin must remain in the system',
          });
        }
      }

      user.role = role;
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (typeof isBlocked === 'boolean') user.isBlocked = isBlocked;

    await user.save();

    res.json({
      success: true,
      message: 'User updated',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isBlocked: user.isBlocked,
        address: user.address,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete admin user' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    await Booking.deleteMany({ user: user._id });
    await user.deleteOne();

    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
