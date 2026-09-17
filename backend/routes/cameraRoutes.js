const express = require('express');
const router = express.Router();
const {
  getCameras,
  getCamera,
  createCamera,
  updateCamera,
  deleteCamera,
} = require('../controllers/cameraController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getCameras);
router.get('/:id', getCamera);
router.post('/', authMiddleware, adminMiddleware, upload.array('images', 8), createCamera);
router.put('/:id', authMiddleware, adminMiddleware, upload.array('images', 8), updateCamera);
router.delete('/:id', authMiddleware, adminMiddleware, deleteCamera);

module.exports = router;
