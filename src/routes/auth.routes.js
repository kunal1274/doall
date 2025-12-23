const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const { validateTenant } = require("../middleware/tenant.middleware");
const { validate } = require("../middleware/validation.middleware");

// Apply tenant validation to all routes
router.use(validateTenant);

// Register
router.post(
  "/register",
  [
    body("phone").isMobilePhone().withMessage("Valid phone number required"),
    body("email").optional().isEmail().withMessage("Valid email required"),
    body("first_name").trim().notEmpty().withMessage("First name required"),
    body("last_name").trim().notEmpty().withMessage("Last name required"),
    body("role").isIn(["customer", "provider"]).withMessage("Invalid role"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    validate,
  ],
  authController.register
);

// Login
router.post(
  "/login",
  [
    body("phone").isMobilePhone().withMessage("Valid phone number required"),
    body("password").notEmpty().withMessage("Password required"),
    validate,
  ],
  authController.login
);

// Send OTP
router.post(
  "/send-otp",
  [
    body("phone").isMobilePhone().withMessage("Valid phone number required"),
    validate,
  ],
  authController.sendOTP
);

// Verify OTP
router.post(
  "/verify-otp",
  [
    body("otp_id").notEmpty().withMessage("OTP ID required"),
    body("otp")
      .isLength({ min: 6, max: 6 })
      .withMessage("Valid 6-digit OTP required"),
    body("phone").isMobilePhone().withMessage("Valid phone number required"),
    validate,
  ],
  authController.verifyOTP
);

// Refresh token
router.post("/refresh-token", authController.refreshToken);

// Logout
router.post(
  "/logout",
  require("../middleware/auth.middleware").protect,
  authController.logout
);

module.exports = router;
