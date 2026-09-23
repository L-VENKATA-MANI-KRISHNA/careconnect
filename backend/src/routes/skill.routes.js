const express = require('express');
const {
  getSkills,
  createSkill,
  updateSkill,
  deleteSkill,
} = require('../controllers/skill.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', getSkills);
router.post('/', requireAuth, requireRole('PLATFORM_ADMIN'), createSkill);
router.patch('/:id', requireAuth, requireRole('PLATFORM_ADMIN'), updateSkill);
router.delete('/:id', requireAuth, requireRole('PLATFORM_ADMIN'), deleteSkill);

module.exports = router;
