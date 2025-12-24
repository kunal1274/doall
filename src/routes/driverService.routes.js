const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { ensureTenantAccess } = require("../middleware/tenant.middleware");
const driverServiceController = require("../controllers/driverServiceController");

// All routes require authentication
router.use(protect);
router.use(ensureTenantAccess);

// Driver profile
router.get("/profile", driverServiceController.getProfile);
router.patch("/availability", driverServiceController.updateAvailability);

// Trip management
router.get("/active-trip", driverServiceController.getActiveTrip);
router.post("/bookings/:id/accept", driverServiceController.acceptBooking);
router.post("/trips/start", driverServiceController.startTrip);
router.post("/trips/end", driverServiceController.endTrip);

// Location tracking
router.post("/location/update", driverServiceController.updateLocation);

// Earnings
router.get("/earnings", driverServiceController.getEarnings);

module.exports = router;
