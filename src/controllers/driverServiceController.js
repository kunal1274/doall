const Driver = require("../models/Driver");
const DriverBooking = require("../models/DriverBooking");
const TripSession = require("../models/TripSession");

// @desc    Get driver profile
// @route   GET /api/v1/driver-service/drivers/profile
// @access  Private (Driver)
exports.getProfile = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ user_id: req.user.id }).populate(
      "user_id"
    );

    if (!driver) {
      return res.status(404).json({
        success: false,
        error: { message: "Driver profile not found" },
      });
    }

    res.status(200).json({
      success: true,
      data: { driver },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update driver availability
// @route   PATCH /api/v1/driver-service/drivers/availability
// @access  Private (Driver)
exports.updateAvailability = async (req, res, next) => {
  try {
    const { status, lat, lng } = req.body;

    const updateData = {
      "availability.status": status,
      "availability.last_online": new Date(),
    };

    if (lat && lng) {
      updateData["availability.current_location"] = {
        lat,
        lng,
        updated_at: new Date(),
      };
    }

    const driver = await Driver.findOneAndUpdate(
      { user_id: req.user.id },
      updateData,
      { new: true }
    );

    // Emit WebSocket event
    req.app
      .get("socketManager")
      .emitToRoom("dispatchers", "driver:availability_changed", {
        driver_id: driver._id,
        status,
        location: { lat, lng },
      });

    res.status(200).json({
      success: true,
      data: { driver },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active trip
// @route   GET /api/v1/driver-service/drivers/active-trip
// @access  Private (Driver)
exports.getActiveTrip = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ user_id: req.user.id });

    const booking = await DriverBooking.findOne({
      driver_id: driver._id,
      status: {
        $in: ["driver_assigned", "driver_en_route", "trip_started"],
      },
    })
      .populate("customer_id vehicle_id")
      .populate({
        path: "driver_id",
        populate: { path: "user_id" },
      });

    if (!booking) {
      return res.status(200).json({
        success: true,
        data: { booking: null },
      });
    }

    // Get trip session if exists
    const tripSession = await TripSession.findOne({
      booking_id: booking._id,
    });

    res.status(200).json({
      success: true,
      data: {
        booking,
        tripSession,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept booking
// @route   POST /api/v1/driver-service/drivers/bookings/:id/accept
// @access  Private (Driver)
exports.acceptBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const driver = await Driver.findOne({ user_id: req.user.id });

    const booking = await DriverBooking.findByIdAndUpdate(
      id,
      {
        status: "driver_en_route",
        $push: {
          status_history: {
            status: "driver_en_route",
            updated_by: req.user.id,
            notes: "Driver accepted and en route",
          },
        },
      },
      { new: true }
    );

    // Update driver status
    await Driver.findByIdAndUpdate(driver._id, {
      "availability.status": "busy",
    });

    // Notify customer
    req.app
      .get("socketManager")
      .emitToRoom(`customer_${booking.customer_id}`, "driver:en_route", {
        booking_id: id,
        driver,
      });

    res.status(200).json({
      success: true,
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start trip
// @route   POST /api/v1/driver-service/drivers/trips/start
// @access  Private (Driver)
exports.startTrip = async (req, res, next) => {
  try {
    const { booking_id, trip_pin, lat, lng } = req.body;

    // Verify PIN
    const tripSession = await TripSession.findOne({ booking_id });

    if (!tripSession) {
      return res.status(404).json({
        success: false,
        error: { message: "Trip session not found" },
      });
    }

    if (tripSession.trip_pin !== trip_pin) {
      return res.status(400).json({
        success: false,
        error: { message: "Invalid PIN" },
      });
    }

    // Update trip session
    tripSession.status = "started";
    tripSession["session_data.start_time"] = new Date();
    tripSession["session_data.start_location"] = {
      lat,
      lng,
    };
    tripSession["verification.pin_verified"] = true;
    tripSession["verification.verified_at"] = new Date();
    await tripSession.save();

    // Update booking
    const booking = await DriverBooking.findByIdAndUpdate(
      booking_id,
      {
        status: "trip_started",
        "trip_details.start_time": new Date(),
        $push: {
          status_history: {
            status: "trip_started",
            updated_by: req.user.id,
          },
        },
      },
      { new: true }
    );

    // Notify customer
    req.app
      .get("socketManager")
      .emitToRoom(`customer_${booking.customer_id}`, "trip:started", {
        booking_id,
        start_time: new Date(),
      });

    res.status(200).json({
      success: true,
      data: {
        booking,
        tripSession,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    End trip
// @route   POST /api/v1/driver-service/drivers/trips/end
// @access  Private (Driver)
exports.endTrip = async (req, res, next) => {
  try {
    const { booking_id, lat, lng, odometer_reading } = req.body;

    const tripSession = await TripSession.findOne({ booking_id });

    // Calculate duration
    const startTime = new Date(tripSession.session_data.start_time);
    const endTime = new Date();
    const duration = Math.floor((endTime - startTime) / (1000 * 60)); // minutes

    // Update trip session
    tripSession.status = "completed";
    tripSession["session_data.end_time"] = endTime;
    tripSession["session_data.end_location"] = { lat, lng };
    tripSession["session_data.duration.actual_minutes"] = duration;
    await tripSession.save();

    // Update booking
    const booking = await DriverBooking.findByIdAndUpdate(
      booking_id,
      {
        status: "trip_completed",
        "trip_details.end_time": endTime,
        "trip_details.total_minutes": duration,
        "trip_details.end_odometer": odometer_reading,
        $push: {
          status_history: {
            status: "trip_completed",
            updated_by: req.user.id,
          },
        },
      },
      { new: true }
    );

    // Update driver status
    const driver = await Driver.findOne({ user_id: req.user.id });
    await Driver.findByIdAndUpdate(driver._id, {
      "availability.status": "online",
      $inc: {
        "performance.completed_trips": 1,
        "performance.total_trips": 1,
      },
    });

    // Notify customer
    req.app
      .get("socketManager")
      .emitToRoom(`customer_${booking.customer_id}`, "trip:completed", {
        booking_id,
        duration,
      });

    res.status(200).json({
      success: true,
      data: {
        booking,
        tripSession,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update location during trip
// @route   POST /api/v1/driver-service/drivers/location/update
// @access  Private (Driver)
exports.updateLocation = async (req, res, next) => {
  try {
    const { lat, lng, speed } = req.body;

    const driver = await Driver.findOneAndUpdate(
      { user_id: req.user.id },
      {
        "availability.current_location": {
          type: "Point",
          coordinates: [lng, lat],
          lat,
          lng,
          updated_at: new Date(),
        },
      },
      { new: true }
    );

    // Emit to dispatcher
    req.app
      .get("socketManager")
      .emitToRoom("dispatchers", "driver:location_update", {
        driver_id: driver._id,
        location: { lat, lng },
        speed,
      });

    // If driver has active booking, notify customer
    const activeBooking = await DriverBooking.findOne({
      driver_id: driver._id,
      status: { $in: ["driver_en_route", "trip_started", "driver_assigned"] },
    });

    if (activeBooking) {
      req.app
        .get("socketManager")
        .emitToRoom(
          `customer_${activeBooking.customer_id}`,
          "driver:location_update",
          {
            location: { lat, lng },
            booking_id: activeBooking._id,
          }
        );
    }

    res.status(200).json({
      success: true,
      data: { location: { lat, lng } },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get driver earnings
// @route   GET /api/v1/driver-service/drivers/earnings
// @access  Private (Driver)
exports.getEarnings = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ user_id: req.user.id });

    // Get trip history
    const trips = await DriverBooking.find({
      driver_id: driver._id,
      status: { $in: ["trip_completed", "payment_done", "closed"] },
    })
      .sort({ "trip_details.end_time": -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      data: {
        earnings: driver.earnings,
        trips,
      },
    });
  } catch (error) {
    next(error);
  }
};
