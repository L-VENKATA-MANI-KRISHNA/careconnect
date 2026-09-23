const mongoose = require('mongoose');

const PRICING_RULE_TYPES = ['FLAT_MARKUP', 'PERCENTAGE_FEE', 'SURGE', 'MINIMUM_FLOOR'];

const pricingRuleSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCategory',
      required: true,
      index: true,
    },
    ruleType: {
      type: String,
      enum: PRICING_RULE_TYPES,
      required: true,
    },
    value: {
      type: Number,
      required: true,
      default: 0,
    },
    minimumPrice: {
      type: Number,
      default: 0,
    },
    maximumPrice: {
      type: Number,
      default: 10000,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
    },
    effectiveTo: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const PricingRule = mongoose.model('PricingRule', pricingRuleSchema);

module.exports = {
  PricingRule,
  PRICING_RULE_TYPES,
};
