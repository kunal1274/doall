// ==========================================
// src/models/PromoCode.js
// Promo Code Model
// ==========================================

const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema({
  tenant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  description: String,
  type: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  max_discount: Number, // Cap for percentage discounts
  min_order_value: Number,
  usage_limit: Number,
  usage_count: { type: Number, default: 0 },
  user_limit: { type: Number, default: 1 }, // Uses per user
  valid_from: Date,
  valid_until: Date,
  applicable_services: [String], // Service IDs or 'all'
  first_time_only: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'active'
  }
}, {
  timestamps: true
});

promoCodeSchema.index({ tenant_id: 1, code: 1 }, { unique: true });
promoCodeSchema.index({ valid_until: 1 });

module.exports = mongoose.model('PromoCode', promoCodeSchema);

