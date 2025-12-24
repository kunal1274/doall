const Driver = require("../models/Driver");
const DriverBooking = require("../models/DriverBooking");
const TripSession = require("../models/TripSession");
const Vehicle = require("../models/Vehicle");
const User = require("../models/User");
const { calculateDistance } = require("./geoController");

// @desc    Get all bookings for dispatcher
// @route   GET /api/v1/driver-service/dispatcher/bookings
// @access  Private (Dispatcher)
exports.getBookings = async (req, res, next) => {
  try {
    const { status, date, search } = req.query;
    const tenant_id = req.user.tenant_id;

    let query = { tenant_id };

    // Filter by status
    if (status && status !== "all") {
      query.status = status;
    }

    // Filter by date
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query["schedule.scheduled_for"] = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
    }

    const bookings = await DriverBooking.find(query)
      .populate("customer_id", "profile")
      .populate("driver_id")
      .populate("vehicle_id")
      .sort({ "schedule.scheduled_for": -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: { bookings },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign driver to booking
// @route   POST /api/v1/driver-service/dispatcher/bookings/:id/assign
// @access  Private (Dispatcher)
exports.assignDriver = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { driver_id } = req.body;

    // Check if driver exists and is available
    const driver = await Driver.findById(driver_id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        error: { message: "Driver not found" },
      });
    }

    if (driver.availability.status !== "online") {
      return res.status(400).json({
        success: false,
        error: { message: "Driver is not available" },
      });
    }

    // Update booking
    const booking = await DriverBooking.findByIdAndUpdate(
      id,
      {
        driver_id,
        status: "driver_assigned",
        $push: {
          status_history: {
            status: "driver_assigned",
            updated_by: req.user.id,
            notes: `Assigned to driver ${driver.user_id}`,
          },
        },
      },
      { new: true }
    ).populate("driver_id customer_id vehicle_id");

    // Update driver status
    await Driver.findByIdAndUpdate(driver_id, {
      "availability.status": "busy",
    });

    // Emit WebSocket event
    req.app
      .get("socketManager")
      .emitToRoom(`driver_${driver_id}`, "booking:assigned", {
        booking_id: id,
        booking,
      });

    res.status(200).json({
      success: true,
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all drivers
// @route   GET /api/v1/driver-service/dispatcher/drivers
// @access  Private (Dispatcher)
exports.getDrivers = async (req, res, next) => {
  try {
    const { status, available } = req.query;
    const tenant_id = req.user.tenant_id;

    let query = { tenant_id };

    if (status) {
      query["availability.status"] = status;
    }

    if (available === "true") {
      query["availability.status"] = "online";
    }

    const drivers = await Driver.find(query)
      .populate("user_id", "profile")
      .sort({ "availability.last_online": -1 });

    res.status(200).json({
      success: true,
      count: drivers.length,
      data: { drivers },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/v1/driver-service/dispatcher/stats
// @access  Private (Dispatcher)
exports.getDashboardStats = async (req, res, next) => {
  try {
    const tenant_id = req.user.tenant_id;

    // Active bookings
    const activeBookings = await DriverBooking.countDocuments({
      tenant_id,
      status: {
        $in: [
          "requested",
          "searching_driver",
          "driver_assigned",
          "driver_en_route",
          "trip_started",
        ],
      },
    });

    // Online drivers
    const onlineDrivers = await Driver.countDocuments({
      tenant_id,
      "availability.status": "online",
    });

    // Today's completed bookings
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const completedToday = await DriverBooking.countDocuments({
      tenant_id,
      status: "trip_completed",
      "trip_details.end_time": { $gte: startOfDay },
    });

    // Today's revenue
    const revenueResult = await DriverBooking.aggregate([
      {
        $match: {
          tenant_id: tenant_id,
          status: { $in: ["payment_done", "closed"] },
          "payment.paid_at": { $gte: startOfDay },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$pricing.final_amount" },
        },
      },
    ]);

    const todayRevenue = revenueResult[0]?.total || 0;

    // Pending settlements
    const settlementResult = await Driver.aggregate([
      { $match: { tenant_id: tenant_id } },
      {
        $group: {
          _id: null,
          total: { $sum: "$earnings.pending_settlement" },
        },
      },
    ]);

    const pendingSettlements = settlementResult[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: {
        stats: {
          activeBookings,
          onlineDrivers,
          completedToday,
          todayRevenue,
          pendingSettlements,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get real-time map data
// @route   GET /api/v1/driver-service/dispatcher/map-data
// @access  Private (Dispatcher)
exports.getMapData = async (req, res, next) => {
  try {
    const tenant_id = req.user.tenant_id;

    // Get online drivers with their locations
    const drivers = await Driver.find({
      tenant_id,
      "availability.status": { $in: ["online", "busy"] },
      "availability.current_location.lat": { $exists: true },
    })
      .populate("user_id", "profile")
      .select("availability.current_location availability.status user_id");

    // Get active bookings with locations
    const bookings = await DriverBooking.find({
      tenant_id,
      status: {
        $in: ["driver_assigned", "driver_en_route", "trip_started"],
      },
    })
      .populate("driver_id")
      .populate("customer_id", "profile")
      .select("locations driver_id customer_id status");

    res.status(200).json({
      success: true,
      data: {
        drivers,
        bookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Auto-assign nearest driver to booking
// @route   POST /api/v1/driver-service/dispatcher/bookings/:id/auto-assign
// @access  Private (Dispatcher)
exports.autoAssignDriver = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { max_distance_km = 10 } = req.body;

    const booking = await DriverBooking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { message: "Booking not found" },
      });
    }

    if (booking.driver_id) {
      return res.status(400).json({
        success: false,
        error: { message: "Driver already assigned" },
      });
    }

    const pickup_lat = booking.locations.pickup.lat;
    const pickup_lng = booking.locations.pickup.lng;

    // Find available drivers
    const availableDrivers = await Driver.find({
      tenant_id: booking.tenant_id,
      "availability.status": "online",
      "availability.current_location.lat": { $exists: true },
      "availability.current_location.lng": { $exists: true },
    }).populate("user_id", "profile");

    if (availableDrivers.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: "No available drivers found" },
      });
    }

    // Calculate distances and filter
    const driversWithDistance = availableDrivers
      .map((driver) => {
        const driverLat = driver.availability.current_location.lat;
        const driverLng = driver.availability.current_location.lng;
        const distance = calculateDistance(
          pickup_lat,
          pickup_lng,
          driverLat,
          driverLng
        );

        return {
          driver,
          distance_km: parseFloat(distance.toFixed(2)),
        };
      })
      .filter((d) => d.distance_km <= max_distance_km)
      .sort((a, b) => a.distance_km - b.distance_km);

    if (driversWithDistance.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: `No drivers found within ${max_distance_km}km` },
      });
    }

    // Select nearest driver
    const selectedDriver = driversWithDistance[0].driver;

    // Assign driver
    booking.driver_id = selectedDriver._id;
    booking.status = "driver_assigned";
    booking.status_history.push({
      status: "driver_assigned",
      updated_by: req.user.id,
      notes: `Auto-assigned to nearest driver (${driversWithDistance[0].distance_km}km away)`,
    });
    await booking.save();

    // Update driver status
    await Driver.findByIdAndUpdate(selectedDriver._id, {
      "availability.status": "busy",
    });

    // Create trip session if not exists
    let tripSession = await TripSession.findOne({ booking_id: booking._id });
    if (!tripSession) {
      const tripPin = Math.floor(1000 + Math.random() * 9000).toString();
      tripSession = await TripSession.create({
        tenant_id: booking.tenant_id,
        booking_id: booking._id,
        driver_id: selectedDriver._id,
        customer_id: booking.customer_id,
        trip_pin: tripPin,
        status: "pending",
      });
    }

    // Emit WebSocket event
    req.app
      .get("socketManager")
      .emitToRoom(`driver_${selectedDriver._id}`, "booking:assigned", {
        booking_id: id,
        booking: await booking.populate("customer_id vehicle_id"),
      });

    res.status(200).json({
      success: true,
      data: {
        booking: await booking.populate("driver_id customer_id vehicle_id"),
        assigned_driver: selectedDriver,
        distance_km: driversWithDistance[0].distance_km,
      },
    });
  } catch (error) {
    next(error);
  }
};
