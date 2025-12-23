const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const trackingController = require("../controllers/trackingController");
const { protect, authorize } = require("../middleware/auth.middleware");
const { ensureTenantAccess } = require("../middleware/tenant.middleware");
const { validate } = require("../middleware/validation.middleware");

// Apply auth to all routes
router.use(protect);
router.use(ensureTenantAccess);

// Update location (provider only)
router.post(
  "/update",
  authorize("provider"),
  [
    body("job_id").isMongoId().withMessage("Valid job ID required"),
    body("latitude").isFloat().withMessage("Valid latitude required"),
    body("longitude").isFloat().withMessage("Valid longitude required"),
    body("status")
      .isIn(["idle", "on_the_way", "at_location", "working"])
      .withMessage("Invalid status"),
    validate,
  ],
  trackingController.updateLocation
);

// Get live location
router.get("/:job_id/live", trackingController.getLiveLocation);

// Get route history
router.get("/:job_id/route-history", trackingController.getRouteHistory);

module.exports = router;
