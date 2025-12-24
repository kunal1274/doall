const express = require("express");
const router = express.Router();
const geoController = require("../controllers/geoController");
const geoAlertService = require("../services/geoAlertService");
const { authenticateToken, requireRole } = require("../middleware/auth");

// Service Area Management
router.post(
  "/service-areas",
  authenticateToken,
  requireRole(["admin"]),
  geoController.createServiceArea
);
router.get("/service-areas", authenticateToken, geoController.getServiceAreas);
router.get(
  "/service-areas/:id",
  authenticateToken,
  geoController.getServiceAreaById
);
router.put(
  "/service-areas/:id",
  authenticateToken,
  requireRole(["admin"]),
  geoController.updateServiceArea
);
router.delete(
  "/service-areas/:id",
  authenticateToken,
  requireRole(["admin"]),
  geoController.deleteServiceArea
);

// Geo-fencing checks
router.post(
  "/check-service-area",
  authenticateToken,
  geoController.checkServiceArea
);
router.post(
  "/find-nearest-drivers",
  authenticateToken,
  geoController.findNearestDrivers
);

// Pricing calculation
router.post(
  "/calculate-pricing",
  authenticateToken,
  geoController.calculatePricing
);

// Geo Alerts
router.get(
  "/alerts/booking/:booking_id",
  authenticateToken,
  geoAlertService.getBookingAlerts
);
router.get(
  "/alerts/driver/:driver_id",
  authenticateToken,
  geoAlertService.getDriverAlerts
);

module.exports = router;
