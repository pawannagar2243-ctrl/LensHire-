const Booking = require('../models/Booking');
const Camera = require('../models/Camera');
const { calcDays } = require('../utils/helpers');
const { isAdminRole } = require('../utils/roles');

const hasOverlap = async (cameraId, startDate, endDate, excludeId = null) => {
  const query = {
    camera: cameraId,
    bookingStatus: { $in: ['Pending', 'Confirmed'] },
    startDate: { $lte: new Date(endDate) },
    endDate: { $gte: new Date(startDate) },
  };
  if (excludeId) query._id = { $ne: excludeId };
  const conflict = await Booking.findOne(query);
  return Boolean(conflict);
};

// @desc    Create booking
// @route   POST /api/bookings
exports.createBooking = async (req, res) => {
  try {
    const { cameraId, startDate, endDate, quantity = 1, customerDetails, notes } = req.body;

    if (!cameraId || !startDate || !endDate || !customerDetails) {
      return res.status(400).json({
        success: false,
        message: 'Camera, dates and customer details are required',
      });
    }

    const { name, email, phone } = customerDetails;
    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Customer name, email and phone are required',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid dates' });
    }

    if (end < start) {
      return res.status(400).json({ success: false, message: 'End date must be after start date' });
    }

    if (start < today) {
      return res.status(400).json({ success: false, message: 'Start date cannot be in the past' });
    }

    const camera = await Camera.findById(cameraId);
    if (!camera) {
      return res.status(404).json({ success: false, message: 'Camera not found' });
    }

    if (!camera.availability) {
      return res.status(400).json({ success: false, message: 'Camera is not available for booking' });
    }

    const qty = Math.max(1, Number(quantity) || 1);
    if (qty > (camera.stock || 1)) {
      return res.status(400).json({ success: false, message: 'Requested quantity exceeds available stock' });
    }

    if (await hasOverlap(cameraId, start, end)) {
      return res.status(400).json({
        success: false,
        message: 'Camera is already booked for the selected dates',
      });
    }

    const totalDays = calcDays(start, end);
    const totalAmount = camera.pricePerDay * totalDays * qty + camera.securityDeposit;

    const booking = await Booking.create({
      user: req.user._id,
      camera: cameraId,
      startDate: start,
      endDate: end,
      quantity: qty,
      totalDays,
      pricePerDay: camera.pricePerDay,
      securityDeposit: camera.securityDeposit,
      totalAmount,
      customerDetails: {
        name,
        email,
        phone,
        address: customerDetails.address || '',
      },
      notes: notes || '',
      bookingStatus: 'Pending',
      paymentStatus: 'Pending',
    });

    const populated = await Booking.findById(booking._id)
      .populate('camera', 'name brand model images pricePerDay')
      .populate('user', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: populated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get bookings (user: own, admin: all)
// @route   GET /api/bookings
exports.getBookings = async (req, res) => {
  try {
    const { status, paymentStatus, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (!isAdminRole(req.user.role)) {
      filter.user = req.user._id;
    }

    if (status) filter.bookingStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Math.min(100, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    let bookings = await Booking.find(filter)
      .populate('camera', 'name brand model images pricePerDay')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    if (search && isAdminRole(req.user.role)) {
      const q = search.toLowerCase();
      bookings = bookings.filter(
        (b) =>
          b.customerDetails?.name?.toLowerCase().includes(q) ||
          b.customerDetails?.email?.toLowerCase().includes(q) ||
          b.camera?.name?.toLowerCase().includes(q) ||
          String(b._id).includes(q)
      );
    }

    const total = await Booking.countDocuments(filter);

    res.json({
      success: true,
      count: bookings.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      bookings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('camera')
      .populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (!isAdminRole(req.user.role) && booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id
exports.updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const isOwner = booking.user.toString() === req.user._id.toString();
    const isAdmin = isAdminRole(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { bookingStatus, paymentStatus, notes } = req.body;

    // Users can only cancel their own pending/confirmed bookings
    if (!isAdmin) {
      if (bookingStatus && bookingStatus !== 'Cancelled') {
        return res.status(403).json({ success: false, message: 'Users can only cancel bookings' });
      }
      if (!['Pending', 'Confirmed'].includes(booking.bookingStatus)) {
        return res.status(400).json({ success: false, message: 'Booking cannot be cancelled' });
      }
      booking.bookingStatus = 'Cancelled';
    } else {
      if (bookingStatus) {
        if (!['Pending', 'Confirmed', 'Cancelled', 'Completed'].includes(bookingStatus)) {
          return res.status(400).json({ success: false, message: 'Invalid booking status' });
        }

        if (
          ['Pending', 'Confirmed'].includes(bookingStatus) &&
          bookingStatus !== booking.bookingStatus
        ) {
          const overlap = await hasOverlap(
            booking.camera,
            booking.startDate,
            booking.endDate,
            booking._id
          );
          if (overlap) {
            return res.status(400).json({
              success: false,
              message: 'Cannot set status — overlapping booking exists',
            });
          }
        }

        booking.bookingStatus = bookingStatus;
      }

      if (paymentStatus) {
        if (!['Pending', 'Paid', 'Failed', 'Refunded'].includes(paymentStatus)) {
          return res.status(400).json({ success: false, message: 'Invalid payment status' });
        }
        booking.paymentStatus = paymentStatus;
      }

      if (notes !== undefined) booking.notes = notes;
    }

    await booking.save();

    const populated = await Booking.findById(booking._id)
      .populate('camera', 'name brand model images')
      .populate('user', 'name email phone');

    res.json({ success: true, message: 'Booking updated', booking: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete booking (admin)
// @route   DELETE /api/bookings/:id
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    await booking.deleteOne();
    res.json({ success: true, message: 'Booking deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check availability
// @route   GET /api/bookings/check-availability
exports.checkAvailability = async (req, res) => {
  try {
    const { cameraId, startDate, endDate } = req.query;
    if (!cameraId || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'cameraId, startDate and endDate required' });
    }

    const camera = await Camera.findById(cameraId);
    if (!camera) {
      return res.status(404).json({ success: false, message: 'Camera not found' });
    }

    const overlap = await hasOverlap(cameraId, startDate, endDate);
    const totalDays = calcDays(startDate, endDate);
    const quantity = 1;
    const totalAmount = camera.pricePerDay * totalDays * quantity + camera.securityDeposit;

    res.json({
      success: true,
      available: camera.availability && !overlap,
      totalDays,
      pricePerDay: camera.pricePerDay,
      securityDeposit: camera.securityDeposit,
      totalAmount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
