const express = require('express');
const {
  createContactMessage,
  getContactMessages,
  markContactMessageRead,
  updateContactMessageStatus,
} = require('../controllers/contactController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/', createContactMessage);
router.get('/', authMiddleware, adminMiddleware, getContactMessages);
router.put('/:id/read', authMiddleware, adminMiddleware, markContactMessageRead);
router.put('/:id/status', authMiddleware, adminMiddleware, updateContactMessageStatus);

module.exports = router;
