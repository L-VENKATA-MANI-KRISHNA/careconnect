const ServiceCategory = require('../models/ServiceCategory');
const ApiError = require('../utils/errors');
const { sendSuccess } = require('../utils/response');
const { logAction } = require('../services/audit.service');

// GET /api/categories
const getCategories = async (req, res, next) => {
  try {
    const filter = req.query.all === 'true' && req.user?.role === 'PLATFORM_ADMIN' ? {} : { isActive: true };
    const categories = await ServiceCategory.find(filter).sort({ name: 1 });
    return sendSuccess(res, 'Categories retrieved successfully', categories);
  } catch (err) {
    next(err);
  }
};

// GET /api/categories/:id
const getCategoryById = async (req, res, next) => {
  try {
    const category = await ServiceCategory.findById(req.params.id);
    if (!category) {
      return next(ApiError.notFound('Category not found'));
    }
    return sendSuccess(res, 'Category details', category);
  } catch (err) {
    next(err);
  }
};

// POST /api/categories (Admin only)
const createCategory = async (req, res, next) => {
  try {
    const { name, description, icon, requiredSkills, basePrice, isActive } = req.body;

    const existing = await ServiceCategory.findOne({ name });
    if (existing) {
      return next(ApiError.conflict('A category with this name already exists'));
    }

    const category = await ServiceCategory.create({
      name,
      description,
      icon,
      requiredSkills,
      basePrice,
      isActive: isActive !== undefined ? isActive : true,
    });

    await logAction({
      actor: req.user,
      action: 'CATEGORY_CREATED',
      entityType: 'ServiceCategory',
      entityId: category._id,
      metadata: { name: category.name, basePrice },
      req,
    });

    return sendSuccess(res, 'Category created successfully', category, 201);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/categories/:id (Admin only)
const updateCategory = async (req, res, next) => {
  try {
    const category = await ServiceCategory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return next(ApiError.notFound('Category not found'));
    }

    await logAction({
      actor: req.user,
      action: 'CATEGORY_UPDATED',
      entityType: 'ServiceCategory',
      entityId: category._id,
      metadata: req.body,
      req,
    });

    return sendSuccess(res, 'Category updated successfully', category);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/categories/:id (Admin only - soft delete)
const deleteCategory = async (req, res, next) => {
  try {
    const category = await ServiceCategory.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!category) {
      return next(ApiError.notFound('Category not found'));
    }

    await logAction({
      actor: req.user,
      action: 'CATEGORY_DEACTIVATED',
      entityType: 'ServiceCategory',
      entityId: category._id,
      req,
    });

    return sendSuccess(res, 'Category deactivated successfully', category);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
