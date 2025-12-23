// ==========================================
// src/routes/pricing.routes.js
// ==========================================
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const pricingController = require('../controllers/pricingController');
const { protect, authorize } = require('../middleware/auth.middleware');
const { ensureTenantAccess } = require('../middleware/tenant.middleware');
const { validate } = require('../middleware/validation.middleware');

// Apply auth to all routes
router.use(protect);
router.use(ensureTenantAccess);

// Apply general adjustment
router.post(
  '/jobs/:job_id/adjustments',
  authorize('admin', 'dispatcher'),
  [
    body('type').isIn([
      'discount', 'waiver', 'additional_charge', 'rate_cut',
      'commission_waiver', 'promotional', 'loyalty', 'referral', 'compensation'
    ]).withMessage('Invalid adjustment type'),
    body('description').notEmpty().withMessage('Description required'),
    body('applied_to').isIn(['subtotal', 'labor', 'materials', 'commission', 'late_fine', 'total'])
      .withMessage('Invalid applied_to field'),
    validate
  ],
  pricingController.applyAdjustment
);

// Quick discount
router.post(
  '/jobs/:job_id/discount',
  authorize('admin', 'dispatcher'),
  [
    body('description').optional().isString(),
    body('reason').optional().isString(),
    validate
  ],
  pricingController.applyDiscount
);

// Waive late fine
router.post(
  '/jobs/:job_id/waive-late-fine',
  authorize('admin'),
  [
    body('reason').notEmpty().withMessage('Reason required'),
    validate
  ],
  pricingController.waiveLateFine
);

// Commission override
router.post(
  '/jobs/:job_id/commission-override',
  authorize('admin'),
  [
    body('platform_fee').isFloat({ min: 0, max: 100 }).withMessage('Valid platform fee required'),
    body('dispatcher_cut').isFloat({ min: 0, max: 100 }).withMessage('Valid dispatcher cut required'),
    body('admin_cut').isFloat({ min: 0, max: 100 }).withMessage('Valid admin cut required'),
    body('provider_cut').isFloat({ min: 0, max: 100 }).withMessage('Valid provider cut required'),
    body('reason').notEmpty().withMessage('Reason required'),
    validate
  ],
  pricingController.applyCommissionOverride
);

// Apply promo code
router.post(
  '/jobs/:job_id/promo-code',
  authorize('customer'),
  [
    body('promo_code').notEmpty().withMessage('Promo code required'),
    validate
  ],
  pricingController.applyPromoCode
);

// Approve adjustment
router.put(
  '/jobs/:job_id/adjustments/:adjustment_id/approve',
  authorize('admin'),
  pricingController.approveAdjustment
);

// Remove adjustment
router.delete(
  '/jobs/:job_id/adjustments/:adjustment_id',
  authorize('admin'),
  pricingController.removeAdjustment
);

module.exports = router;

