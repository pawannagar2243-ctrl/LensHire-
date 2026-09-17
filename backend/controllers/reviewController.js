const Review = require('../models/Review');
const Camera = require('../models/Camera');
const { isAdminRole } = require('../utils/roles');

const updateCameraRating = async (cameraId) => {
  const reviews = await Review.find({ camera: cameraId });
  const count = reviews.length;
  const avg = count ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;
  await Camera.findByIdAndUpdate(cameraId, {
    rating: Math.round(avg * 10) / 10,
    reviewCount: count,
  });
};

exports.getReviewsByCamera = async (req, res) => {
  try {
    const reviews = await Review.find({ camera: req.params.cameraId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createReview = async (req, res) => {
  try {
    const { cameraId, rating, comment } = req.body;

    if (!cameraId || !rating) {
      return res.status(400).json({ success: false, message: 'Camera and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const camera = await Camera.findById(cameraId);
    if (!camera) {
      return res.status(404).json({ success: false, message: 'Camera not found' });
    }

    const existing = await Review.findOne({ user: req.user._id, camera: cameraId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already reviewed this camera' });
    }

    const review = await Review.create({
      user: req.user._id,
      camera: cameraId,
      rating,
      comment: comment || '',
    });

    await updateCameraRating(cameraId);

    const populated = await Review.findById(review._id).populate('user', 'name');
    res.status(201).json({ success: true, message: 'Review added', review: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const isOwner = review.user.toString() === req.user._id.toString();
    if (!isOwner && !isAdminRole(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const cameraId = review.camera;
    await review.deleteOne();
    await updateCameraRating(cameraId);

    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
