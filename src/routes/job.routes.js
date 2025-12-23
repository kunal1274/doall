const express = require("express");
const router = express.Router();
const { body, query } = require("express-validator");
const jobController = require("../controllers/jobController");
const { protect, authorize } = require("../middleware/auth.middleware");
const { ensureTenantAccess } = require("../middleware/tenant.middleware");
const { validate } = require("../middleware/validation.middleware");

// Apply auth to all routes
router.use(protect);
router.use(ensureTenantAccess);

// Create job
router.post(
  "/",
  authorize("customer"),
  [
    body("service_id").isMongoId().withMessage("Valid service ID required"),
    body("address_id").notEmpty().withMessage("Address ID required"),
    body("booking_type")
      .isIn(["instant", "scheduled"])
      .withMessage("Invalid booking type"),
    body("preferred_date")
      .optional()
      .isISO8601()
      .withMessage("Valid date required"),
    validate,
  ],
  jobController.createJob
);

// Get all jobs
router.get("/", jobController.getJobs);

// Get job by ID
router.get("/:job_id", jobController.getJobById);

// Assign job (dispatcher/admin)
router.put(
  "/:job_id/assign",
  authorize("dispatcher", "admin"),
  [
    body("provider_id").isMongoId().withMessage("Valid provider ID required"),
    validate,
  ],
  jobController.assignJob
);

// Accept job (provider)
router.put("/:job_id/accept", authorize("provider"), jobController.acceptJob);

// Reject job (provider)
router.put(
  "/:job_id/reject",
  authorize("provider"),
  [
    body("reason").notEmpty().withMessage("Rejection reason required"),
    validate,
  ],
  jobController.rejectJob
);

// Start work (provider)
router.put(
  "/:job_id/start",
  authorize("provider"),
  [
    body("latitude").isFloat().withMessage("Valid latitude required"),
    body("longitude").isFloat().withMessage("Valid longitude required"),
    validate,
  ],
  jobController.startWork
);

// Complete work (provider)
router.put(
  "/:job_id/complete",
  authorize("provider"),
  [
    body("materials_used")
      .optional()
      .isArray()
      .withMessage("Materials must be an array"),
    validate,
  ],
  jobController.completeWork
);

// Cancel job
router.put(
  "/:job_id/cancel",
  [
    body("reason").notEmpty().withMessage("Cancellation reason required"),
    validate,
  ],
  jobController.cancelJob
);

// Rate job (customer)
router.post(
  "/:job_id/rate",
  authorize("customer"),
  [
    body("overall_rating")
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be 1-5"),
    validate,
  ],
  jobController.rateJob
);

module.exports = router;
