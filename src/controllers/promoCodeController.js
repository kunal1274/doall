// ==========================================
// src/controllers/promoCodeController.js
// Promo Code Controller
// ==========================================

const PromoCode = require('../models/PromoCode');
const Job = require('../models/Job');

// @desc    Validate promo code
// @route   POST /api/v1/promo-codes/validate
// @access  Private
exports.validatePromoCode = async (req, res) => {
  try {
    const { code, job_id } = req.body;

    const promoCode = await PromoCode.findOne({
      tenant_id: req.tenantId,
      code: code.toUpperCase(),
      status: 'active',
      valid_from: { $lte: new Date() },
      valid_until: { $gte: new Date() }
    });

    if (!promoCode) {
      return res.status(404).json({
        success: false,
        error: { code: 'INVALID_PROMO_CODE', message: 'Invalid or expired promo code' }
      });
    }

    // Check usage limit
    if (promoCode.usage_limit && promoCode.usage_count >= promoCode.usage_limit) {
      return res.status(400).json({
        success: false,
        error: { code: 'PROMO_CODE_EXHAUSTED', message: 'Promo code usage limit reached' }
      });
    }

    // Check if first time only
    if (promoCode.first_time_only) {
      const previousJobs = await Job.countDocuments({
        tenant_id: req.tenantId,
        customer_id: req.userId,
        status: 'completed'
      });

      if (previousJobs > 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'PROMO_CODE_NOT_APPLICABLE', message: 'This promo code is for first-time users only' }
        });
      }
    }

    res.json({
      success: true,
      data: {
        promo_code: promoCode,
        discount: {
          type: promoCode.type,
          value: promoCode.value,
          description: promoCode.description
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'VALIDATE_PROMO_CODE_FAILED', message: error.message }
    });
  }
};

// @desc    Create promo code
// @route   POST /api/v1/admin/promo-codes
// @access  Private (Admin)
exports.createPromoCode = async (req, res) => {
  try {
    const promoCode = await PromoCode.create({
      ...req.body,
      tenant_id: req.tenantId
    });

    res.status(201).json({
      success: true,
      data: { promo_code: promoCode }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_PROMO_CODE_FAILED', message: error.message }
    });
  }
};

module.exports = exports;

