const Skill = require('../models/Skill');
const ApiError = require('../utils/errors');
const { sendSuccess } = require('../utils/response');

// GET /api/skills
const getSkills = async (req, res, next) => {
  try {
    const { category } = req.query;
    const filter = { isActive: true };
    if (category) {
      filter.category = category;
    }
    const skills = await Skill.find(filter).populate('category', 'name').sort({ name: 1 });
    return sendSuccess(res, 'Skills retrieved successfully', skills);
  } catch (err) {
    next(err);
  }
};

// POST /api/skills (Admin only)
const createSkill = async (req, res, next) => {
  try {
    const { name, description, category, isActive } = req.body;
    const existing = await Skill.findOne({ name });
    if (existing) {
      return next(ApiError.conflict('Skill already exists'));
    }

    const skill = await Skill.create({
      name,
      description,
      category,
      isActive: isActive !== undefined ? isActive : true,
    });

    return sendSuccess(res, 'Skill created successfully', skill, 201);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/skills/:id (Admin only)
const updateSkill = async (req, res, next) => {
  try {
    const skill = await Skill.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!skill) {
      return next(ApiError.notFound('Skill not found'));
    }
    return sendSuccess(res, 'Skill updated successfully', skill);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/skills/:id (Admin only)
const deleteSkill = async (req, res, next) => {
  try {
    const skill = await Skill.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!skill) {
      return next(ApiError.notFound('Skill not found'));
    }
    return sendSuccess(res, 'Skill deactivated successfully', skill);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSkills,
  createSkill,
  updateSkill,
  deleteSkill,
};
