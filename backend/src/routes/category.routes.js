const express = require('express');
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/category.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', getCategories);
router.get('/:id', getCategoryById);
router.post('/', requireAuth, requireRole('PLATFORM_ADMIN'), createCategory);
router.patch('/:id', requireAuth, requireRole('PLATFORM_ADMIN'), updateCategory);
router.delete('/:id', requireAuth, requireRole('PLATFORM_ADMIN'), deleteCategory);

module.exports = router;
