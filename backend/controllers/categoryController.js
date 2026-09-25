const Category = require('../models/Category');
const Camera = require('../models/Camera');

const resolveUploadedImage = (file) => {
  if (!file) return '';

  if (typeof file.path === 'string' && file.path.trim()) return file.path;
  if (typeof file.secure_url === 'string' && file.secure_url.trim()) return file.secure_url;
  if (typeof file.url === 'string' && file.url.trim()) return file.url;
  if (typeof file.filename === 'string' && file.filename.trim()) return `/uploads/${file.filename}`;

  return '';
};

exports.resolveUploadedImage = resolveUploadedImage;

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    const withCounts = await Promise.all(
      categories.map(async (cat) => {
        const count = await Camera.countDocuments({ category: cat._id });
        return { ...cat.toObject(), cameraCount: count };
      })
    );
    res.json({ success: true, categories: withCounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const exists = await Category.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }

    const image = resolveUploadedImage(req.file) || req.body.image || '';
    const category = await Category.create({ name, description, image });

    res.status(201).json({ success: true, message: 'Category created', category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (req.body.name) category.name = req.body.name;
    if (req.body.description !== undefined) category.description = req.body.description;
    if (req.file) {
      category.image = resolveUploadedImage(req.file);
    } else if (req.body.image !== undefined) {
      category.image = req.body.image;
    }

    await category.save();
    res.json({ success: true, message: 'Category updated', category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const cameraCount = await Camera.countDocuments({ category: category._id });
    if (cameraCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${cameraCount} camera(s). Reassign them first.`,
      });
    }

    await category.deleteOne();
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
