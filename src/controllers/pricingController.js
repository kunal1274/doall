// ==========================================
// src/controllers/pricingController.js
// Advanced Pricing Management Controller
// ==========================================

const Job = require('../models/Job');
const Tenant = require('../models/Tenant');
const PromoCode = require('../models/PromoCode');
const commissionService = require('../services/commissionService');

/**
 * Apply general adjustment to job pricing
 */
exports.applyAdjustment = async (req, res) => {
  try {
    const { job_id } = req.params;
    const { type, description, amount, percentage, applied_to, reason, requires_approval } = req.body;

    const job = await Job.findOne({
      _id: job_id,
      tenant_id: req.tenantId
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: { code: 'JOB_NOT_FOUND', message: 'Job not found' }
      });
    }

    // Initialize adjustments array if not exists
    if (!job.pricing.adjustments) {
      job.pricing.adjustments = [];
    }

    // Calculate adjustment amount
    let adjustmentAmount = 0;
    if (percentage) {
      const baseAmount = getBaseAmountForAdjustment(job.pricing, applied_to);
      adjustmentAmount = (baseAmount * percentage) / 100;
    } else if (amount) {
      adjustmentAmount = amount;
    } else {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ADJUSTMENT', message: 'Either amount or percentage required' }
      });
    }

    // Handle discounts and waivers (negative amounts)
    if (type === 'discount' || type === 'waiver') {
      adjustmentAmount = -Math.abs(adjustmentAmount);
    }

    // Create adjustment object
    const adjustment = {
      adjustment_id: `adj_${Date.now()}`,
      type,
      description: description || `${type} adjustment`,
      amount: adjustmentAmount,
      percentage: percentage || null,
      applied_to,
      applied_by: req.userId,
      applied_at: new Date(),
      reason: reason || '',
      status: requires_approval ? 'pending' : 'approved',
      approved_by: requires_approval ? null : req.userId,
      approved_at: requires_approval ? null : new Date()
    };

    job.pricing.adjustments.push(adjustment);

    // Recalculate pricing
    await recalculatePricing(job);

    await job.save();

    res.json({
      success: true,
      data: {
        adjustment,
        job: {
          pricing: {
            subtotal: job.pricing.subtotal,
            adjustments: job.pricing.adjustments,
            total_amount: job.pricing.total_amount,
            final_breakdown: getFinalBreakdown(job.pricing),
            commission_split: job.pricing.commission_split
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'APPLY_ADJUSTMENT_FAILED', message: error.message }
    });
  }
};

/**
 * Apply quick discount
 */
exports.applyDiscount = async (req, res) => {
  try {
    const { job_id } = req.params;
    const { percentage, amount, description, reason } = req.body;

    if (!percentage && !amount) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DISCOUNT', message: 'Either percentage or amount required' }
      });
    }

    const job = await Job.findOne({
      _id: job_id,
      tenant_id: req.tenantId
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: { code: 'JOB_NOT_FOUND', message: 'Job not found' }
      });
    }

    // Initialize adjustments array if not exists
    if (!job.pricing.adjustments) {
      job.pricing.adjustments = [];
    }

    let discountAmount = 0;
    if (percentage) {
      discountAmount = (job.pricing.subtotal * percentage) / 100;
    } else {
      discountAmount = Math.min(amount, job.pricing.subtotal); // Cap at subtotal
    }

    const adjustment = {
      adjustment_id: `adj_${Date.now()}`,
      type: 'discount',
      description: description || `Discount ${percentage ? `${percentage}%` : `₹${amount}`}`,
      amount: -Math.abs(discountAmount),
      percentage: percentage || null,
      applied_to: 'subtotal',
      applied_by: req.userId,
      applied_at: new Date(),
      reason: reason || '',
      status: 'approved',
      approved_by: req.userId,
      approved_at: new Date()
    };

    job.pricing.adjustments.push(adjustment);

    await recalculatePricing(job);
    await job.save();

    res.json({
      success: true,
      data: {
        adjustment,
        job: {
          pricing: {
            subtotal: job.pricing.subtotal,
            adjustments: job.pricing.adjustments,
            total_amount: job.pricing.total_amount,
            final_breakdown: getFinalBreakdown(job.pricing),
            commission_split: job.pricing.commission_split
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'APPLY_DISCOUNT_FAILED', message: error.message }
    });
  }
};

/**
 * Waive late fine
 */
exports.waiveLateFine = async (req, res) => {
  try {
    const { job_id } = req.params;
    const { reason } = req.body;

    const job = await Job.findOne({
      _id: job_id,
      tenant_id: req.tenantId
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: { code: 'JOB_NOT_FOUND', message: 'Job not found' }
      });
    }

    if (!job.pricing.late_fine || !job.pricing.late_fine.total_penalty) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_LATE_FINE', message: 'No late fine to waive' }
      });
    }

    // Initialize adjustments array if not exists
    if (!job.pricing.adjustments) {
      job.pricing.adjustments = [];
    }

    const adjustment = {
      adjustment_id: `adj_${Date.now()}`,
      type: 'waiver',
      description: 'Late Fine Waiver',
      amount: -Math.abs(job.pricing.late_fine.total_penalty),
      applied_to: 'late_fine',
      applied_by: req.userId,
      applied_at: new Date(),
      reason: reason,
      status: 'approved',
      approved_by: req.userId,
      approved_at: new Date()
    };

    job.pricing.adjustments.push(adjustment);
    job.pricing.late_fine.total_penalty = 0;

    await recalculatePricing(job);
    await job.save();

    res.json({
      success: true,
      data: {
        adjustment,
        job: {
          pricing: {
            subtotal: job.pricing.subtotal,
            adjustments: job.pricing.adjustments,
            total_amount: job.pricing.total_amount,
            final_breakdown: getFinalBreakdown(job.pricing),
            commission_split: job.pricing.commission_split
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'WAIVE_LATE_FINE_FAILED', message: error.message }
    });
  }
};

/**
 * Apply commission override
 */
exports.applyCommissionOverride = async (req, res) => {
  try {
    const { job_id } = req.params;
    const { platform_fee, dispatcher_cut, admin_cut, provider_cut, reason } = req.body;

    // Validate percentages sum to 100
    const total = platform_fee + dispatcher_cut + admin_cut + provider_cut;
    if (Math.abs(total - 100) > 0.01) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_COMMISSION', message: 'Commission percentages must total 100%' }
      });
    }

    const job = await Job.findOne({
      _id: job_id,
      tenant_id: req.tenantId
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: { code: 'JOB_NOT_FOUND', message: 'Job not found' }
      });
    }

    // Store original commission config
    if (!job.pricing.commission_override) {
      job.pricing.commission_override = {
        original: { ...job.pricing.commission_split },
        override: {
          platform_fee_percentage: platform_fee,
          dispatcher_percentage: dispatcher_cut,
          admin_percentage: admin_cut,
          provider_percentage: provider_cut
        },
        applied_by: req.userId,
        applied_at: new Date(),
        reason: reason
      };
    } else {
      job.pricing.commission_override.override = {
        platform_fee_percentage: platform_fee,
        dispatcher_percentage: dispatcher_cut,
        admin_percentage: admin_cut,
        provider_percentage: provider_cut
      };
      job.pricing.commission_override.reason = reason;
    }

    // Recalculate commission split
    await recalculateCommission(job);

    await job.save();

    res.json({
      success: true,
      data: {
        commission_override: job.pricing.commission_override,
        job: {
          pricing: {
            commission_split: job.pricing.commission_split
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'COMMISSION_OVERRIDE_FAILED', message: error.message }
    });
  }
};

/**
 * Apply promo code
 */
exports.applyPromoCode = async (req, res) => {
  try {
    const { job_id } = req.params;
    const { promo_code } = req.body;

    const job = await Job.findOne({
      _id: job_id,
      tenant_id: req.tenantId,
      customer_id: req.userId
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: { code: 'JOB_NOT_FOUND', message: 'Job not found' }
      });
    }

    // Find and validate promo code
    const promo = await PromoCode.findOne({
      tenant_id: req.tenantId,
      code: promo_code.toUpperCase(),
      status: 'active',
      valid_from: { $lte: new Date() },
      valid_until: { $gte: new Date() }
    });

    if (!promo) {
      return res.status(404).json({
        success: false,
        error: { code: 'INVALID_PROMO_CODE', message: 'Invalid or expired promo code' }
      });
    }

    // Check usage limit
    if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
      return res.status(400).json({
        success: false,
        error: { code: 'PROMO_CODE_EXHAUSTED', message: 'Promo code usage limit reached' }
      });
    }

    // Check if already used by this user
    const userPromoUsage = job.pricing.adjustments?.filter(
      adj => adj.type === 'promotional' && adj.promo_code === promo.code
    ).length || 0;

    if (userPromoUsage >= promo.user_limit) {
      return res.status(400).json({
        success: false,
        error: { code: 'PROMO_CODE_LIMIT_REACHED', message: 'You have already used this promo code' }
      });
    }

    // Check minimum order value
    if (promo.min_order_value && job.pricing.subtotal < promo.min_order_value) {
      return res.status(400).json({
        success: false,
        error: { code: 'MIN_ORDER_VALUE', message: `Minimum order value of ₹${promo.min_order_value} required` }
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (promo.type === 'percentage') {
      discountAmount = (job.pricing.subtotal * promo.value) / 100;
      if (promo.max_discount) {
        discountAmount = Math.min(discountAmount, promo.max_discount);
      }
    } else {
      discountAmount = promo.value;
    }

    // Initialize adjustments array if not exists
    if (!job.pricing.adjustments) {
      job.pricing.adjustments = [];
    }

    const adjustment = {
      adjustment_id: `adj_${Date.now()}`,
      type: 'promotional',
      description: `Promo Code: ${promo.code} - ${promo.description || ''}`,
      amount: -Math.abs(discountAmount),
      percentage: promo.type === 'percentage' ? promo.value : null,
      applied_to: 'subtotal',
      applied_by: req.userId,
      applied_at: new Date(),
      promo_code: promo.code,
      status: 'approved',
      approved_by: req.userId,
      approved_at: new Date()
    };

    job.pricing.adjustments.push(adjustment);

    // Update promo code usage
    promo.usage_count += 1;
    await promo.save();

    await recalculatePricing(job);
    await job.save();

    res.json({
      success: true,
      data: {
        adjustment,
        promo_code: {
          code: promo.code,
          description: promo.description,
          discount: discountAmount
        },
        job: {
          pricing: {
            subtotal: job.pricing.subtotal,
            adjustments: job.pricing.adjustments,
            total_amount: job.pricing.total_amount,
            final_breakdown: getFinalBreakdown(job.pricing)
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'APPLY_PROMO_CODE_FAILED', message: error.message }
    });
  }
};

/**
 * Approve adjustment
 */
exports.approveAdjustment = async (req, res) => {
  try {
    const { job_id, adjustment_id } = req.params;

    const job = await Job.findOne({
      _id: job_id,
      tenant_id: req.tenantId
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: { code: 'JOB_NOT_FOUND', message: 'Job not found' }
      });
    }

    const adjustment = job.pricing.adjustments?.find(
      adj => adj.adjustment_id === adjustment_id
    );

    if (!adjustment) {
      return res.status(404).json({
        success: false,
        error: { code: 'ADJUSTMENT_NOT_FOUND', message: 'Adjustment not found' }
      });
    }

    if (adjustment.status === 'approved') {
      return res.status(400).json({
        success: false,
        error: { code: 'ALREADY_APPROVED', message: 'Adjustment already approved' }
      });
    }

    adjustment.status = 'approved';
    adjustment.approved_by = req.userId;
    adjustment.approved_at = new Date();

    await recalculatePricing(job);
    await job.save();

    res.json({
      success: true,
      data: {
        adjustment,
        job: {
          pricing: {
            subtotal: job.pricing.subtotal,
            adjustments: job.pricing.adjustments,
            total_amount: job.pricing.total_amount,
            final_breakdown: getFinalBreakdown(job.pricing)
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'APPROVE_ADJUSTMENT_FAILED', message: error.message }
    });
  }
};

/**
 * Remove adjustment
 */
exports.removeAdjustment = async (req, res) => {
  try {
    const { job_id, adjustment_id } = req.params;

    const job = await Job.findOne({
      _id: job_id,
      tenant_id: req.tenantId
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: { code: 'JOB_NOT_FOUND', message: 'Job not found' }
      });
    }

    if (!job.pricing.adjustments) {
      return res.status(404).json({
        success: false,
        error: { code: 'ADJUSTMENT_NOT_FOUND', message: 'No adjustments found' }
      });
    }

    const adjustmentIndex = job.pricing.adjustments.findIndex(
      adj => adj.adjustment_id === adjustment_id
    );

    if (adjustmentIndex === -1) {
      return res.status(404).json({
        success: false,
        error: { code: 'ADJUSTMENT_NOT_FOUND', message: 'Adjustment not found' }
      });
    }

    job.pricing.adjustments.splice(adjustmentIndex, 1);

    await recalculatePricing(job);
    await job.save();

    res.json({
      success: true,
      data: {
        message: 'Adjustment removed successfully',
        job: {
          pricing: {
            subtotal: job.pricing.subtotal,
            adjustments: job.pricing.adjustments,
            total_amount: job.pricing.total_amount,
            final_breakdown: getFinalBreakdown(job.pricing)
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'REMOVE_ADJUSTMENT_FAILED', message: error.message }
    });
  }
};

// ==========================================
// Helper Methods
// ==========================================

/**
 * Get base amount for adjustment calculation
 */
function getBaseAmountForAdjustment(pricing, applied_to) {
  switch (applied_to) {
    case 'labor':
      return pricing.labor_cost || 0;
    case 'materials':
      return pricing.materials_total || 0;
    case 'commission':
      return pricing.commission_split?.provider_gross_amount || 0;
    case 'late_fine':
      return pricing.late_fine?.total_penalty || 0;
    case 'total':
      return pricing.total_amount || 0;
    case 'subtotal':
    default:
      return pricing.subtotal || 0;
  }
}

/**
 * Recalculate pricing after adjustments
 */
async function recalculatePricing(job) {
  const pricing = job.pricing;

  // Calculate base subtotal
  let baseSubtotal = (pricing.labor_cost || 0) +
    (pricing.materials_total || 0) +
    (pricing.peak_hour_surcharge || 0) +
    (pricing.emergency_surcharge || 0) +
    (pricing.distance_charge || 0);

  // Apply adjustments (only approved ones)
  const approvedAdjustments = (pricing.adjustments || []).filter(
    adj => adj.status === 'approved'
  );

  let totalAdjustments = 0;
  approvedAdjustments.forEach(adj => {
    if (adj.applied_to === 'subtotal' || adj.applied_to === 'total') {
      totalAdjustments += adj.amount;
    }
  });

  // Calculate adjusted subtotal
  const adjustedSubtotal = Math.max(0, baseSubtotal + totalAdjustments);

  // Recalculate GST
  const tenant = await Tenant.findById(job.tenant_id);
  const gstRate = 18; // Default 18% GST
  const cgstPercentage = gstRate / 2;
  const sgstPercentage = gstRate / 2;
  const igstPercentage = 0; // Set based on state comparison if needed

  const cgstAmount = (adjustedSubtotal * cgstPercentage) / 100;
  const sgstAmount = (adjustedSubtotal * sgstPercentage) / 100;
  const igstAmount = (adjustedSubtotal * igstPercentage) / 100;
  const totalGST = cgstAmount + sgstAmount + igstAmount;

  // Calculate total (including late fine if not waived)
  const lateFine = (pricing.late_fine?.total_penalty || 0);
  const totalAmount = adjustedSubtotal + totalGST + lateFine;

  // Update pricing
  pricing.subtotal = adjustedSubtotal;
  pricing.gst = {
    cgst_percentage: cgstPercentage,
    sgst_percentage: sgstPercentage,
    igst_percentage: igstPercentage,
    cgst_amount: cgstAmount,
    sgst_amount: sgstAmount,
    igst_amount: igstAmount,
    total_gst: totalGST
  };
  pricing.total_amount = totalAmount;

  // Recalculate commission
  await recalculateCommission(job);
}

/**
 * Recalculate commission split
 */
async function recalculateCommission(job) {
  const pricing = job.pricing;
  const tenant = await Tenant.findById(job.tenant_id);

  // Use override commission if exists, otherwise use tenant default
  let commissionConfig;
  if (pricing.commission_override?.override) {
    commissionConfig = pricing.commission_override.override;
  } else {
    commissionConfig = tenant.commission_config;
  }

  const subtotal = pricing.subtotal || 0;
  const platformFeeAmount = (subtotal * commissionConfig.platform_fee_percentage) / 100;
  const dispatcherAmount = (subtotal * commissionConfig.dispatcher_percentage) / 100;
  const adminAmount = (subtotal * commissionConfig.admin_percentage) / 100;
  const providerGrossAmount = subtotal - (platformFeeAmount + dispatcherAmount + adminAmount);

  // Deduct late fine from provider if applicable
  const lateFineDeduction = (pricing.late_fine?.total_penalty || 0);
  const providerNetAmount = Math.max(0, providerGrossAmount - lateFineDeduction);

  pricing.commission_split = {
    platform_fee_percentage: commissionConfig.platform_fee_percentage,
    platform_fee_amount: platformFeeAmount,
    dispatcher_percentage: commissionConfig.dispatcher_percentage,
    dispatcher_amount: dispatcherAmount,
    admin_percentage: commissionConfig.admin_percentage,
    admin_amount: adminAmount,
    provider_percentage: commissionConfig.provider_percentage,
    provider_gross_amount: providerGrossAmount,
    late_fine_deduction: lateFineDeduction,
    provider_net_amount: providerNetAmount
  };
}

/**
 * Get final breakdown for response
 */
function getFinalBreakdown(pricing) {
  const approvedAdjustments = (pricing.adjustments || []).filter(
    adj => adj.status === 'approved'
  );

  const totalDiscounts = approvedAdjustments
    .filter(adj => adj.amount < 0)
    .reduce((sum, adj) => sum + Math.abs(adj.amount), 0);

  const totalAdditionalCharges = approvedAdjustments
    .filter(adj => adj.amount > 0)
    .reduce((sum, adj) => sum + adj.amount, 0);

  return {
    original_subtotal: pricing.subtotal + totalDiscounts - totalAdditionalCharges,
    total_discounts: totalDiscounts,
    total_additional_charges: totalAdditionalCharges,
    adjusted_subtotal: pricing.subtotal,
    gst_on_adjusted: pricing.gst?.total_gst || 0,
    late_fine: pricing.late_fine?.total_penalty || 0,
    final_total: pricing.total_amount
  };
}

