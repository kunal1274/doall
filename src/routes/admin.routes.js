const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const adminController = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth.middleware");
const { ensureTenantAccess } = require("../middleware/tenant.middleware");
const { validate } = require("../middleware/validation.middleware");

// Apply auth and admin role to all routes
router.use(protect);
router.use(ensureTenantAccess);
router.use(authorize("admin"));

// Dashboard
router.get("/dashboard", adminController.getDashboardStats);

// User management
router.get("/users", adminController.getUsers);

router.put(
  "/users/:user_id/verify",
  [
    body("verification_status")
      .isIn(["pending", "verified", "rejected"])
      .withMessage("Invalid verification status"),
    validate,
  ],
  adminController.verifyProvider
);

router.put(
  "/users/:user_id/status",
  [
    body("status")
      .isIn(["active", "inactive", "suspended", "blocked"])
      .withMessage("Invalid status"),
    body("reason").notEmpty().withMessage("Reason required"),
    validate,
  ],
  adminController.updateUserStatus
);

// Tenant configuration
router.put(
  "/tenant/commission",
  [
    body("platform_fee")
      .isFloat({ min: 0, max: 100 })
      .withMessage("Valid platform fee required"),
    body("dispatcher_cut")
      .isFloat({ min: 0, max: 100 })
      .withMessage("Valid dispatcher cut required"),
    body("admin_cut")
      .isFloat({ min: 0, max: 100 })
      .withMessage("Valid admin cut required"),
    body("provider_cut")
      .isFloat({ min: 0, max: 100 })
      .withMessage("Valid provider cut required"),
    validate,
  ],
  adminController.updateCommissionConfig
);

module.exports = router;
