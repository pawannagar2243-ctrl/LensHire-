const Camera = require('../models/Camera');
const User = require('../models/User');
const Booking = require('../models/Booking');

exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalCameras,
      totalUsers,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      completedBookings,
      revenueAgg,
      bookings,
    ] = await Promise.all([
      Camera.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Booking.countDocuments(),
      Booking.countDocuments({ bookingStatus: 'Pending' }),
      Booking.countDocuments({ bookingStatus: 'Confirmed' }),
      Booking.countDocuments({ bookingStatus: 'Cancelled' }),
      Booking.countDocuments({ bookingStatus: 'Completed' }),
      Booking.aggregate([
        { $match: { paymentStatus: 'Paid', bookingStatus: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Booking.find()
        .populate('camera', 'name')
        .select('createdAt totalAmount bookingStatus camera')
        .sort({ createdAt: 1 }),
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;

    // Monthly bookings & revenue (last 12 months)
    const monthlyMap = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = { month: key, bookings: 0, revenue: 0 };
    }

    bookings.forEach((b) => {
      const d = new Date(b.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap[key]) {
        monthlyMap[key].bookings += 1;
        if (b.bookingStatus !== 'Cancelled') {
          monthlyMap[key].revenue += b.totalAmount || 0;
        }
      }
    });

    // Popular cameras
    const popularCameras = await Booking.aggregate([
      { $match: { bookingStatus: { $ne: 'Cancelled' } } },
      { $group: { _id: '$camera', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
      {
        $lookup: {
          from: 'cameras',
          localField: '_id',
          foreignField: '_id',
          as: 'camera',
        },
      },
      { $unwind: { path: '$camera', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          count: 1,
          revenue: 1,
          name: '$camera.name',
          brand: '$camera.brand',
        },
      },
    ]);

    const bookingStatus = [
      { status: 'Pending', count: pendingBookings },
      { status: 'Confirmed', count: confirmedBookings },
      { status: 'Cancelled', count: cancelledBookings },
      { status: 'Completed', count: completedBookings },
    ];

    res.json({
      success: true,
      stats: {
        totalCameras,
        totalUsers,
        totalBookings,
        pendingBookings,
        confirmedBookings,
        cancelledBookings,
        completedBookings,
        totalRevenue,
      },
      charts: {
        monthlyBookings: Object.values(monthlyMap),
        monthlyRevenue: Object.values(monthlyMap),
        popularCameras,
        bookingStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
