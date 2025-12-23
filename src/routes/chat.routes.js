const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const chatController = require("../controllers/chatController");
const { protect } = require("../middleware/auth.middleware");
const { ensureTenantAccess } = require("../middleware/tenant.middleware");
const { validate } = require("../middleware/validation.middleware");

// Apply auth to all routes
router.use(protect);
router.use(ensureTenantAccess);

// Get messages
router.get("/:job_id/messages", chatController.getMessages);

// Send message
router.post(
  "/:job_id/send",
  [
    body("message_type")
      .isIn(["text", "image", "location", "file"])
      .withMessage("Invalid message type"),
    body("content").notEmpty().withMessage("Message content required"),
    body("recipient_id").isMongoId().withMessage("Valid recipient ID required"),
    validate,
  ],
  chatController.sendMessage
);

// Mark as read
router.put(
  "/messages/mark-read",
  [
    body("message_ids").isArray().withMessage("Message IDs must be an array"),
    validate,
  ],
  chatController.markAsRead
);

module.exports = router;
