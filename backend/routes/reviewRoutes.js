const express = require('express');
const router = express.Router();
const {
  getReviewsByCamera,
  createReview,
  deleteReview,
} = require('../controllers/reviewController');
const { authMiddleware } = require('../middleware/auth');

router.get('/:cameraId', getReviewsByCamera);
router.post('/', authMiddleware, createReview);
router.delete('/:id', authMiddleware, deleteReview);

module.exports = router;
