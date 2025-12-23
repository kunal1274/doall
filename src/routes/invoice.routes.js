const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const invoiceController = require("../controllers/invoiceController");
const { protect } = require("../middleware/auth.middleware");
const { ensureTenantAccess } = require("../middleware/tenant.middleware");
const { validate } = require("../middleware/validation.middleware");

// Apply auth to all routes
router.use(protect);
router.use(ensureTenantAccess);

// Get invoice
router.get("/:job_id", invoiceController.getInvoice);

// Generate invoice PDF
router.post("/:job_id/generate", invoiceController.generateInvoice);

// Send invoice
router.post(
  "/:job_id/send",
  [
    body("channels").isArray().withMessage("Channels must be an array"),
    validate,
  ],
  invoiceController.sendInvoice
);

module.exports = router;
