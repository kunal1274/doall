const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth.middleware");
const { ensureTenantAccess } = require("../middleware/tenant.middleware");
const dispatcherController = require("../controllers/dispatcherController");
const { autoAssignValidation } = require("../middleware/inputValidation");

// All routes require authentication and dispatcher role
router.use(protect);
router.use(ensureTenantAccess);
router.use(authorize("dispatcher", "admin"));

// Dashboard stats
router.get("/stats", dispatcherController.getDashboardStats);

// Bookings management
router.get("/bookings", dispatcherController.getBookings);
router.post("/bookings/:id/assign", dispatcherController.assignDriver);
router.post("/bookings/:id/auto-assign", autoAssignValidation, dispatcherController.autoAssignDriver);

// Driver management
router.get("/drivers", dispatcherController.getDrivers);

// Real-time map data
router.get("/map-data", dispatcherController.getMapData);

module.exports = router;
