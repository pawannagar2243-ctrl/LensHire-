const express = require('express');
const router = express.Router();
const {
  createPayment,
  confirmPayment,
  getPayment,
  getPayments,
} = require('../controllers/paymentController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.post('/', authMiddleware, createPayment);
router.get('/', authMiddleware, adminMiddleware, getPayments);
router.get('/:id', authMiddleware, getPayment);
router.put('/:id/confirm', authMiddleware, confirmPayment);

module.exports = router;
