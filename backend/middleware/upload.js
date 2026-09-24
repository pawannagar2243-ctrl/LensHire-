const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const ensureCloudinaryConfig = (_req, _res, next) => {
  const missing = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].filter(
    (key) => !process.env[key]?.trim()
  );

  if (missing.length) {
    return next(
      new Error(
        `Cloudinary configuration missing. Set ${missing.join(', ')} in backend environment variables.`
      )
    );
  }

  next();
};

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'lenshire/cameras',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [
      {
        quality: 'auto',
        fetch_format: 'auto',
        width: 1200,
        height: 1200,
        crop: 'limit',
      },
    ],
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  const ext = file.originalname.split('.').pop()?.toLowerCase();

  if (ext && allowed.includes(ext)) {
    cb(null, true);
    return;
  }

  cb(new Error('Invalid image format. Allowed: jpg, jpeg, png, webp, gif'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
});

upload.ensureCloudinaryConfig = ensureCloudinaryConfig;

module.exports = upload;
