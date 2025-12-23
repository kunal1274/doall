const express = require("express");
const router = express.Router();
const { body, query } = require("express-validator");
const userController = require("../controllers/userController");
const { protect, authorize } = require("../middleware/auth.middleware");
const { ensureTenantAccess } = require("../middleware/tenant.middleware");
const { validate } = require("../middleware/validation.middleware");

// Apply auth to all routes
router.use(protect);
router.use(ensureTenantAccess);

// Profile routes
router.get("/me", userController.getProfile);
router.put("/me", userController.updateProfile);
router.get("/me/stats", userController.getUserStats);

// Address routes
router.post(
  "/me/addresses",
  [
    body("label")
      .isIn(["home", "work", "other"])
      .withMessage("Invalid address label"),
    body("line1").notEmpty().withMessage("Address line 1 required"),
    body("city").notEmpty().withMessage("City required"),
    body("state").notEmpty().withMessage("State required"),
    body("pincode").notEmpty().withMessage("Pincode required"),
    body("latitude").isFloat().withMessage("Valid latitude required"),
    body("longitude").isFloat().withMessage("Valid longitude required"),
    validate,
  ],
  userController.addAddress
);

router.put("/me/addresses/:address_id", userController.updateAddress);
router.delete("/me/addresses/:address_id", userController.deleteAddress);

// Provider-specific routes
router.put(
  "/me/availability",
  authorize("provider"),
  userController.updateAvailability
);

router.put(
  "/me/documents",
  authorize("provider"),
  userController.updateDocuments
);

router.put(
  "/me/bank-details",
  authorize("provider"),
  [
    body("account_holder_name")
      .notEmpty()
      .withMessage("Account holder name required"),
    body("account_number").notEmpty().withMessage("Account number required"),
    body("ifsc_code").notEmpty().withMessage("IFSC code required"),
    validate,
  ],
  userController.updateBankDetails
);

// Find nearby providers
router.get(
  "/providers/nearby",
  authorize("customer"),
  [
    query("latitude").isFloat().withMessage("Valid latitude required"),
    query("longitude").isFloat().withMessage("Valid longitude required"),
    validate,
  ],
  userController.getNearbyProviders
);

module.exports = router;
