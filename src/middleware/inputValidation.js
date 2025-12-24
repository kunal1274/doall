const { body, param, query, validationResult } = require("express-validator");
const logger = require("../config/logger");

// Validation rules for common patterns
const validationRules = {
  // Email validation
  email: () =>
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email address"),

  // Password validation
  password: () =>
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage(
        "Password must contain at least one uppercase, lowercase, number and special character"
      ),

  // Phone validation
  phone: () =>
    body("phone")
      .isMobilePhone()
      .withMessage("Please provide a valid phone number"),

  // MongoDB ID validation
  mongoId: (fieldName = "id") =>
    param(fieldName)
      .isMongoId()
      .withMessage("Invalid ID format"),

  // Latitude validation
  latitude: (fieldName = "latitude") =>
    body(fieldName)
      .isFloat({ min: -90, max: 90 })
      .withMessage("Latitude must be between -90 and 90"),

  // Longitude validation
  longitude: (fieldName = "longitude") =>
    body(fieldName)
      .isFloat({ min: -180, max: 180 })
      .withMessage("Longitude must be between -180 and 180"),

  // Positive number validation
  positiveNumber: (fieldName) =>
    body(fieldName)
      .isFloat({ min: 0 })
      .withMessage(`${fieldName} must be a positive number`),

  // Required string validation
  requiredString: (fieldName, minLength = 1) =>
    body(fieldName)
      .trim()
      .isLength({ min: minLength })
      .withMessage(`${fieldName} is required and must be at least ${minLength} characters`),

  // Date validation
  date: (fieldName) =>
    body(fieldName)
      .isISO8601()
      .toDate()
      .withMessage(`${fieldName} must be a valid date`),

  // Enum validation
  enum: (fieldName, allowedValues) =>
    body(fieldName)
      .isIn(allowedValues)
      .withMessage(`${fieldName} must be one of: ${allowedValues.join(", ")}`),
};

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => ({
      field: error.param,
      message: error.msg,
      value: error.value,
    }));

    logger.warn(`Validation failed: ${JSON.stringify(errorMessages)} - ${req.method} ${req.originalUrl}`);

    return res.status(400).json({
      success: false,
      error: {
        message: "Validation failed",
        errors: errorMessages,
      },
    });
  }
  
  next();
};

// Specific validation sets for different endpoints

// Authentication validations
const registerValidation = [
  validationRules.requiredString("name", 2),
  validationRules.email(),
  validationRules.password(),
  validationRules.phone(),
  body("role")
    .optional()
    .isIn(["customer", "driver", "provider", "dispatcher", "admin"])
    .withMessage("Invalid role"),
  handleValidationErrors,
];

const loginValidation = [
  validationRules.email(),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

// Geo-location validations
const serviceAreaValidation = [
  validationRules.requiredString("name"),
  validationRules.requiredString("city"),
  validationRules.requiredString("zone_code"),
  body("area_type")
    .isIn(["radius", "polygon", "city"])
    .withMessage("Area type must be radius, polygon, or city"),
  body("max_distance_km")
    .optional()
    .isFloat({ min: 1, max: 1000 })
    .withMessage("Max distance must be between 1 and 1000 km"),
  body("pricing.base_fare")
    .isFloat({ min: 0 })
    .withMessage("Base fare must be a positive number"),
  body("pricing.per_km_charge")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Per km charge must be a positive number"),
  handleValidationErrors,
];

const locationValidation = [
  validationRules.latitude(),
  validationRules.longitude(),
  handleValidationErrors,
];

const gpsTrackingValidation = [
  body("job_id").isMongoId().withMessage("Invalid job ID"),
  validationRules.latitude(),
  validationRules.longitude(),
  body("accuracy").optional().isFloat({ min: 0 }).withMessage("Accuracy must be positive"),
  body("speed").optional().isFloat({ min: 0 }).withMessage("Speed must be positive"),
  body("heading").optional().isFloat({ min: 0, max: 360 }).withMessage("Heading must be 0-360"),
  handleValidationErrors,
];

const pricingCalculationValidation = [
  body("pickup_lat").isFloat({ min: -90, max: 90 }).withMessage("Invalid pickup latitude"),
  body("pickup_lng").isFloat({ min: -180, max: 180 }).withMessage("Invalid pickup longitude"),
  body("drop_lat").optional().isFloat({ min: -90, max: 90 }).withMessage("Invalid drop latitude"),
  body("drop_lng").optional().isFloat({ min: -180, max: 180 }).withMessage("Invalid drop longitude"),
  body("service_area_id").optional().isMongoId().withMessage("Invalid service area ID"),
  handleValidationErrors,
];

// Booking validations
const createBookingValidation = [
  body("vehicle_type").notEmpty().withMessage("Vehicle type is required"),
  body("service_type").notEmpty().withMessage("Service type is required"),
  body("pickup_location.address").notEmpty().withMessage("Pickup address is required"),
  body("pickup_location.lat")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Invalid pickup latitude"),
  body("pickup_location.lng")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Invalid pickup longitude"),
  body("scheduled_for").isISO8601().toDate().withMessage("Invalid scheduled date"),
  handleValidationErrors,
];

const updateBookingValidation = [
  param("id").isMongoId().withMessage("Invalid booking ID"),
  body("status")
    .optional()
    .isIn([
      "requested",
      "searching_driver",
      "driver_assigned",
      "driver_en_route",
      "driver_arrived",
      "trip_in_progress",
      "trip_completed",
      "cancelled",
      "payment_pending",
      "payment_done",
      "closed",
    ])
    .withMessage("Invalid status"),
  handleValidationErrors,
];

// Driver assignment validation
const autoAssignValidation = [
  param("id").isMongoId().withMessage("Invalid booking ID"),
  body("max_distance_km")
    .optional()
    .isFloat({ min: 1, max: 100 })
    .withMessage("Max distance must be between 1 and 100 km"),
  handleValidationErrors,
];

// User update validation
const updateUserValidation = [
  param("id").isMongoId().withMessage("Invalid user ID"),
  body("name").optional().trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
  body("phone").optional().isMobilePhone().withMessage("Invalid phone number"),
  body("email").optional().isEmail().normalizeEmail().withMessage("Invalid email address"),
  handleValidationErrors,
];

module.exports = {
  validationRules,
  handleValidationErrors,
  // Authentication
  registerValidation,
  loginValidation,
  // Geo-location
  serviceAreaValidation,
  locationValidation,
  gpsTrackingValidation,
  pricingCalculationValidation,
  // Bookings
  createBookingValidation,
  updateBookingValidation,
  autoAssignValidation,
  // User
  updateUserValidation,
};
