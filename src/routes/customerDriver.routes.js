const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { ensureTenantAccess } = require("../middleware/tenant.middleware");
const customerDriverController = require("../controllers/customerDriverController");

// All routes require authentication
router.use(protect);
router.use(ensureTenantAccess);

// Vehicle management
router.get("/vehicles", customerDriverController.getVehicles);
router.post("/vehicles", customerDriverController.addVehicle);

// Booking management
router.post("/bookings", customerDriverController.createBooking);
router.get("/bookings", customerDriverController.getBookings);
router.get("/bookings/:id", customerDriverController.getBookingDetails);
router.post("/bookings/:id/cancel", customerDriverController.cancelBooking);
router.post("/bookings/:id/rate", customerDriverController.rateDriver);

module.exports = router;
