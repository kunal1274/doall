const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const serviceController = require("../controllers/serviceController");
const { protect, authorize } = require("../middleware/auth.middleware");
const {
  validateTenant,
  ensureTenantAccess,
} = require("../middleware/tenant.middleware");
const { validate } = require("../middleware/validation.middleware");

// Public routes (tenant validation only)
router.use(validateTenant);

router.get("/", serviceController.getAllServices);
router.get("/categories", serviceController.getCategories);
router.get("/:service_id", serviceController.getServiceById);

// Protected routes (admin only)
router.use(protect);
router.use(ensureTenantAccess);
router.use(authorize("admin"));

router.post(
  "/",
  [
    body("name").notEmpty().withMessage("Service name required"),
    body("slug").notEmpty().withMessage("Service slug required"),
    body("category")
      .isIn([
        "home_services",
        "mobility",
        "maintenance",
        "construction",
        "professional",
      ])
      .withMessage("Invalid category"),
    body("pricing.type")
      .isIn(["hourly", "fixed", "distance_based", "material_based"])
      .withMessage("Invalid pricing type"),
    body("pricing.base_rate")
      .isFloat({ min: 0 })
      .withMessage("Valid base rate required"),
    validate,
  ],
  serviceController.createService
);

router.put("/:service_id", serviceController.updateService);
router.delete("/:service_id", serviceController.deleteService);

// Material routes
router.post(
  "/:service_id/materials",
  [
    body("name").notEmpty().withMessage("Material name required"),
    body("price").isFloat({ min: 0 }).withMessage("Valid price required"),
    body("unit").notEmpty().withMessage("Unit required"),
    validate,
  ],
  serviceController.addMaterial
);

router.put(
  "/:service_id/materials/:material_id",
  serviceController.updateMaterial
);
router.delete(
  "/:service_id/materials/:material_id",
  serviceController.deleteMaterial
);

// Statistics
router.get("/:service_id/stats", serviceController.getServiceStats);

module.exports = router;
