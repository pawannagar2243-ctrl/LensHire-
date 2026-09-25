const Camera = require('../models/Camera');
const cloudinary = require('../config/cloudinary');

const isCloudinaryUrl = (url = '') => /^https?:\/\/[a-z0-9-]+\.cloudinary\.com\//i.test(url);

const getCloudinaryPublicId = (url = '') => {
  if (!isCloudinaryUrl(url)) return null;

  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split('/').filter(Boolean);
    const uploadIndex = segments.indexOf('upload');
    if (uploadIndex === -1 || uploadIndex + 2 >= segments.length) return null;
    const publicId = segments.slice(uploadIndex + 2).join('/');
    return publicId.replace(/\.[^/.]+$/, '');
  } catch {
    return null;
  }
};

const deleteCloudinaryImages = async (images = []) => {
  if (!Array.isArray(images) || !images.length) return [];

  const publicIds = images.map(getCloudinaryPublicId).filter(Boolean);
  if (!publicIds.length) return [];

  return Promise.all(
    publicIds.map(async (publicId) => {
      try {
        return await cloudinary.uploader.destroy(publicId, { invalidate: true });
      } catch (error) {
        console.error('Cloudinary delete failed:', error.message || error);
        return null;
      }
    })
  );
};

// @desc    Get all cameras with filters
// @route   GET /api/cameras
exports.getCameras = async (req, res) => {
  try {
    const {
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      availability,
      featured,
      sort = 'newest',
      page = 1,
      limit = 12,
    } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) filter.category = category;
    if (brand) filter.brand = { $regex: brand, $options: 'i' };
    if (availability === 'true') filter.availability = true;
    if (availability === 'false') filter.availability = false;
    if (featured === 'true') filter.featured = true;

    if (minPrice || maxPrice) {
      filter.pricePerDay = {};
      if (minPrice) filter.pricePerDay.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerDay.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    switch (sort) {
      case 'price_asc':
        sortOption = { pricePerDay: 1 };
        break;
      case 'price_desc':
        sortOption = { pricePerDay: -1 };
        break;
      case 'rating':
        sortOption = { rating: -1 };
        break;
      case 'name':
        sortOption = { name: 1 };
        break;
      case 'popular':
        sortOption = { reviewCount: -1, rating: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Math.min(50, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [cameras, total] = await Promise.all([
      Camera.find(filter)
        .populate('category', 'name')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      Camera.countDocuments(filter),
    ]);

    const brands = await Camera.distinct('brand');

    res.json({
      success: true,
      count: cameras.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      brands,
      cameras,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single camera
// @route   GET /api/cameras/:id
exports.getCamera = async (req, res) => {
  try {
    const camera = await Camera.findById(req.params.id).populate('category', 'name description');
    if (!camera) {
      return res.status(404).json({ success: false, message: 'Camera not found' });
    }
    res.json({ success: true, camera });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create camera
// @route   POST /api/cameras
exports.createCamera = async (req, res) => {
  try {
    const data = { ...req.body };

    if (typeof data.specifications === 'string') {
      try {
        data.specifications = JSON.parse(data.specifications);
      } catch {
        data.specifications = {};
      }
    }

    if (req.files && req.files.length) {
      data.images = req.files.map((f) => f.path);
    } else if (typeof data.images === 'string') {
      try {
        data.images = JSON.parse(data.images);
      } catch {
        data.images = data.images ? [data.images] : [];
      }
    }

    const camera = await Camera.create(data);
    const populated = await Camera.findById(camera._id).populate('category', 'name');

    res.status(201).json({ success: true, message: 'Camera created', camera: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update camera
// @route   PUT /api/cameras/:id
exports.updateCamera = async (req, res) => {
  try {
    const camera = await Camera.findById(req.params.id);
    if (!camera) {
      return res.status(404).json({ success: false, message: 'Camera not found' });
    }

    const data = { ...req.body };

    if (typeof data.specifications === 'string') {
      try {
        data.specifications = JSON.parse(data.specifications);
      } catch {
        delete data.specifications;
      }
    }

    const removeUrls = req.body.removeImageUrls
      ? (Array.isArray(req.body.removeImageUrls)
          ? req.body.removeImageUrls
          : [req.body.removeImageUrls])
      : [];

    if (req.files && req.files.length || removeUrls.length) {
      const newImages = req.files ? req.files.map((f) => f.path) : [];
      const existingImages = (camera.images || []).filter((url) => !removeUrls.includes(url));
      data.images = [...existingImages, ...newImages];
    }

    if (removeUrls.length) {
      const cloudinaryUrls = removeUrls.filter((url) => isCloudinaryUrl(url));
      await deleteCloudinaryImages(cloudinaryUrls);
    }

    Object.assign(camera, data);
    await camera.save();

    const populated = await Camera.findById(camera._id).populate('category', 'name');
    res.json({ success: true, message: 'Camera updated', camera: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete camera
// @route   DELETE /api/cameras/:id
exports.deleteCamera = async (req, res) => {
  try {
    const camera = await Camera.findById(req.params.id);
    if (!camera) {
      return res.status(404).json({ success: false, message: 'Camera not found' });
    }

    await deleteCloudinaryImages(camera.images || []);
    await camera.deleteOne();
    res.json({ success: true, message: 'Camera deleted' });
  } catch (error) {
    console.error('Camera delete error:', error.message || error);
    res.status(500).json({ success: false, message: error.message });
  }
};
