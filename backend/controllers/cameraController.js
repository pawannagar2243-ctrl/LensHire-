const Camera = require('../models/Camera');

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
      data.images = req.files.map((f) => `/uploads/${f.filename}`);
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
        /* keep existing */
        delete data.specifications;
      }
    }

    if (req.files && req.files.length) {
      const newImages = req.files.map((f) => `/uploads/${f.filename}`);
      data.images = [...(camera.images || []), ...newImages];
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
    await camera.deleteOne();
    res.json({ success: true, message: 'Camera deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
