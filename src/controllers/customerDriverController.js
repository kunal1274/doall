const DriverBooking = require("../models/DriverBooking");
const TripSession = require("../models/TripSession");
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");

// @desc    Get customer vehicles
// @route   GET /api/v1/driver-service/customer/vehicles
// @access  Private (Customer)
exports.getVehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find({
      customer_id: req.user.id,
      status: "active",
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: vehicles.length,
      data: { vehicles },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add vehicle
// @route   POST /api/v1/driver-service/customer/vehicles
// @access  Private (Customer)
exports.addVehicle = async (req, res, next) => {
  try {
    const vehicleData = {
      ...req.body,
      tenant_id: req.user.tenant_id,
      customer_id: req.user.id,
    };

    const vehicle = await Vehicle.create(vehicleData);

    res.status(201).json({
      success: true,
      data: { vehicle },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create booking
// @route   POST /api/v1/driver-service/customer/bookings
// @access  Private (Customer)
exports.createBooking = async (req, res, next) => {
  try {
    const bookingData = {
      ...req.body,
      tenant_id: req.user.tenant_id,
      customer_id: req.user.id,
    };

    // Calculate pricing based on service type
    const baseFares = {
      "4hr": 800,
      "8hr": 1500,
      fullday: 2000,
      outstation: 2500,
    };

    const base_fare = baseFares[bookingData.service_type] || 800;
    const gst = base_fare * 0.18;
    const final_amount = base_fare + gst;

    bookingData.pricing = {
      base_fare,
      subtotal: base_fare,
      gst,
      final_amount,
    };

    // Create booking
    const booking = await DriverBooking.create(bookingData);

    // Create trip session with PIN
    const trip_pin = Math.floor(1000 + Math.random() * 9000).toString();
    const tripSession = await TripSession.create({
      tenant_id: req.user.tenant_id,
      booking_id: booking._id,
      driver_id: booking.driver_id,
      trip_pin,
    });

    // Emit to dispatchers
    req.app.get("socketManager").emitToRoom("dispatchers", "booking:created", {
      booking,
    });

    res.status(201).json({
      success: true,
      data: {
        booking,
        trip_pin,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer bookings
// @route   GET /api/v1/driver-service/customer/bookings
// @access  Private (Customer)
exports.getBookings = async (req, res, next) => {
  try {
    const { status } = req.query;

    let query = {
      customer_id: req.user.id,
    };

    if (status && status !== "all") {
      query.status = status;
    }

    const bookings = await DriverBooking.find(query)
      .populate({
        path: "driver_id",
        populate: { path: "user_id" },
      })
      .populate("vehicle_id")
      .sort({ "schedule.scheduled_for": -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: { bookings },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get booking details
// @route   GET /api/v1/driver-service/customer/bookings/:id
// @access  Private (Customer)
exports.getBookingDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await DriverBooking.findOne({
      _id: id,
      customer_id: req.user.id,
    })
      .populate({
        path: "driver_id",
        populate: { path: "user_id" },
      })
      .populate("vehicle_id");

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { message: "Booking not found" },
      });
    }

    // Get trip session
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

// @desc    Cancel booking
// @route   POST /api/v1/driver-service/customer/bookings/:id/cancel
// @access  Private (Customer)
exports.cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await DriverBooking.findOne({
      _id: id,
      customer_id: req.user.id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { message: "Booking not found" },
      });
    }

    // Check if booking can be cancelled
    if (
      !["requested", "searching_driver", "driver_assigned"].includes(
        booking.status
      )
    ) {
      return res.status(400).json({
        success: false,
        error: { message: "Booking cannot be cancelled at this stage" },
      });
    }

    // Update booking
    booking.status = "cancelled";
    booking.cancellation = {
      cancelled_by: "customer",
      reason,
      cancelled_at: new Date(),
    };
    booking.status_history.push({
      status: "cancelled",
      updated_by: req.user.id,
      notes: `Cancelled by customer: ${reason}`,
    });

    await booking.save();

    // If driver was assigned, make them available
    if (booking.driver_id) {
      await Driver.findByIdAndUpdate(booking.driver_id, {
        "availability.status": "online",
      });

      // Notify driver
      req.app
        .get("socketManager")
        .emitToRoom(`driver_${booking.driver_id}`, "booking:cancelled", {
          booking_id: id,
        });
    }

    res.status(200).json({
      success: true,
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Rate driver
// @route   POST /api/v1/driver-service/customer/bookings/:id/rate
// @access  Private (Customer)
exports.rateDriver = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;

    const booking = await DriverBooking.findOneAndUpdate(
      {
        _id: id,
        customer_id: req.user.id,
        status: "trip_completed",
      },
      {
        "ratings.by_customer": {
          rating,
          review,
          rated_at: new Date(),
        },
      },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { message: "Booking not found or cannot be rated" },
      });
    }

    // Update driver's average rating
    const driver = await Driver.findById(booking.driver_id);
    const totalRatings = driver.performance.total_trips;
    const currentAvg = driver.performance.rating_avg;
    const newAvg = (currentAvg * (totalRatings - 1) + rating) / totalRatings;

    await Driver.findByIdAndUpdate(booking.driver_id, {
      "performance.rating_avg": newAvg.toFixed(2),
    });

    res.status(200).json({
      success: true,
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};
