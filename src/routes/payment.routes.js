const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { protect } = require("../middleware/auth.middleware");
const { ensureTenantAccess } = require("../middleware/tenant.middleware");

// Webhook (no auth required - verified by signature)
router.post("/webhook", paymentController.webhook);

// Protected routes
router.use(protect);
router.use(ensureTenantAccess);

router.post("/create-order", paymentController.createOrder);
router.post("/verify", paymentController.verifyPayment);
router.get("/history", paymentController.getPaymentHistory);

module.exports = router;
