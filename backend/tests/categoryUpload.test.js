const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveUploadedImage } = require('../controllers/categoryController');

test('resolveUploadedImage supports Cloudinary uploaded files', () => {
  const image = resolveUploadedImage({
    path: 'https://res.cloudinary.com/demo/image/upload/v123/category.jpg',
    filename: 'unused-name',
  });

  assert.equal(image, 'https://res.cloudinary.com/demo/image/upload/v123/category.jpg');
});

test('resolveUploadedImage falls back to local uploads filename', () => {
  const image = resolveUploadedImage({ filename: 'sample.jpg' });

  assert.equal(image, '/uploads/sample.jpg');
});
