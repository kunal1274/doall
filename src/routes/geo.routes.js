const express = require("express");
const router = express.Router();
const geoController = require("../controllers/geoController");
const geoAlertService = require("../services/geoAlertService");
const { protect, authorize } = require("../middleware/auth.middleware");

// Service Area Management
router.post(
  "/service-areas",
  protect,
  authorize("admin"),
  geoController.createServiceArea
);
router.get("/service-areas", protect, geoController.getServiceAreas);
router.get("/service-areas/:id", protect, geoController.getServiceAreaById);
router.put(
  "/service-areas/:id",
  protect,
  authorize("admin"),
  geoController.updateServiceArea
);
router.delete(
  "/service-areas/:id",
  protect,
  authorize("admin"),
  geoController.deleteServiceArea
);

// Geo-fencing checks
router.post("/check-service-area", protect, geoController.checkServiceArea);
router.post("/find-nearest-drivers", protect, geoController.findNearestDrivers);

// Pricing calculation
router.post("/calculate-pricing", protect, geoController.calculatePricing);

// Geo Alerts
router.get(
  "/alerts/booking/:booking_id",
  protect,
  geoAlertService.getBookingAlerts
);
router.get(
  "/alerts/driver/:driver_id",
  protect,
  geoAlertService.getDriverAlerts
);

module.exports = router;
