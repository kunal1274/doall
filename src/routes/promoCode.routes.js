// ==========================================
// src/routes/promoCode.routes.js
// Promo Code Routes
// ==========================================

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const promoCodeController = require('../controllers/promoCodeController');
const { protect, authorize } = require('../middleware/auth.middleware');
const { ensureTenantAccess } = require('../middleware/tenant.middleware');
const { validate } = require('../middleware/validation.middleware');

// Apply auth to all routes
router.use(protect);
router.use(ensureTenantAccess);

// Validate promo code (accessible to all authenticated users)
router.post(
  '/validate',
  [
    body('code').notEmpty().withMessage('Promo code required'),
    body('job_id').optional().isMongoId().withMessage('Valid job ID required'),
    validate
  ],
  promoCodeController.validatePromoCode
);

module.exports = router;

