const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const notificationController = require("../controllers/notificationController");
const { protect } = require("../middleware/auth.middleware");
const { ensureTenantAccess } = require("../middleware/tenant.middleware");
const { validate } = require("../middleware/validation.middleware");

// Apply auth to all routes
router.use(protect);
router.use(ensureTenantAccess);

// Get notifications
router.get("/", notificationController.getNotifications);

// Mark notification as read
router.put("/:notification_id/read", notificationController.markAsRead);

// Mark all as read
router.put("/read-all", notificationController.markAllAsRead);

// Update FCM token
router.post(
  "/fcm-token",
  [
    body("fcm_token").notEmpty().withMessage("FCM token required"),
    body("device_type")
      .isIn(["web", "ios", "android"])
      .withMessage("Invalid device type"),
    validate,
  ],
  notificationController.updateFCMToken
);

module.exports = router;
