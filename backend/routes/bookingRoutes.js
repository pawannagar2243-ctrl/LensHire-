const express = require('express');
const router = express.Router();
const {
  createBooking,
  getBookings,
  getBooking,
  updateBooking,
  deleteBooking,
  checkAvailability,
} = require('../controllers/bookingController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.get('/check-availability', checkAvailability);
router.post('/', authMiddleware, createBooking);
router.get('/', authMiddleware, getBookings);
router.get('/:id', authMiddleware, getBooking);
router.put('/:id', authMiddleware, updateBooking);
router.delete('/:id', authMiddleware, adminMiddleware, deleteBooking);

module.exports = router;
