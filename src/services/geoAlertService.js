const GeoAlert = require("../models/GeoAlert");
const LocationTracking = require("../models/LocationTracking");
const DriverBooking = require("../models/DriverBooking");
const {
  calculateDistance,
  calculateETA,
} = require("../controllers/geoController");

// Stub notification function until full notification service is implemented
const sendNotification = async (userId, message, type = "info") => {
  console.log(`[Notification] ${type.toUpperCase()} to ${userId}: ${message}`);
  // TODO: Implement actual notification sending (push, SMS, email)
  return { sent: true, userId, message, type };
};

// Process geo-alerts based on location updates
exports.processGeoAlerts = async (
  booking_id,
  driver_id,
  current_lat,
  current_lng
) => {
  try {
    const booking = await DriverBooking.findById(booking_id).populate(
      "customer_id driver_id"
    );

    if (!booking) return;

    const pickup_lat = booking.locations.pickup.lat;
    const pickup_lng = booking.locations.pickup.lng;

    // Calculate distance to pickup
    const distance_to_pickup = calculateDistance(
      current_lat,
      current_lng,
      pickup_lat,
      pickup_lng
    );
    const eta_minutes = calculateETA(distance_to_pickup);

    // Check for approaching pickup (within 2km)
    if (distance_to_pickup <= 2 && distance_to_pickup > 0.5) {
      const existingAlert = await GeoAlert.findOne({
        booking_id,
        alert_type: "driver_approaching_pickup",
        sent: true,
      });

      if (!existingAlert) {
        const alert = await GeoAlert.create({
          tenant_id: booking.tenant_id,
          booking_id,
          driver_id,
          customer_id: booking.customer_id._id,
          alert_type: "driver_approaching_pickup",
          message: `Driver is ${distance_to_pickup.toFixed(
            1
          )}km away, arriving in approximately ${eta_minutes} minutes`,
          location: {
            type: "Point",
            coordinates: [current_lng, current_lat],
          },
          metadata: {
            distance_to_pickup: parseFloat(distance_to_pickup.toFixed(2)),
            eta_minutes,
          },
          sent: true,
          sent_at: new Date(),
        });

        // Send notification to customer
        await sendNotification({
          tenant_id: booking.tenant_id,
          user_id: booking.customer_id._id,
          title: "Driver Approaching",
          message: alert.message,
          type: "geo_alert",
          data: { booking_id, alert_type: "driver_approaching_pickup" },
        });
      }
    }

    // Check for driver arrived (within 500m)
    if (distance_to_pickup <= 0.5) {
      const existingAlert = await GeoAlert.findOne({
        booking_id,
        alert_type: "driver_arrived",
        sent: true,
      });

      if (!existingAlert) {
        const alert = await GeoAlert.create({
          tenant_id: booking.tenant_id,
          booking_id,
          driver_id,
          customer_id: booking.customer_id._id,
          alert_type: "driver_arrived",
          message: "Driver has arrived at pickup location",
          location: {
            type: "Point",
            coordinates: [current_lng, current_lat],
          },
          metadata: {
            distance_to_pickup: parseFloat(distance_to_pickup.toFixed(2)),
            eta_minutes: 0,
          },
          sent: true,
          sent_at: new Date(),
        });

        // Send notification to customer
        await sendNotification({
          tenant_id: booking.tenant_id,
          user_id: booking.customer_id._id,
          title: "Driver Arrived",
          message: alert.message,
          type: "geo_alert",
          data: { booking_id, alert_type: "driver_arrived" },
        });

        // Update booking status
        booking.status = "driver_arrived";
        booking.status_history.push({
          status: "driver_arrived",
          timestamp: new Date(),
          notes: "Driver arrived at pickup location",
        });
        await booking.save();
      }
    }

    // ETA update every 30 seconds
    const lastEtaUpdate = await GeoAlert.findOne({
      booking_id,
      alert_type: "eta_update",
    }).sort({ createdAt: -1 });

    const shouldUpdateEta =
      !lastEtaUpdate || Date.now() - lastEtaUpdate.createdAt.getTime() > 30000;

    if (shouldUpdateEta && distance_to_pickup > 0.5) {
      await GeoAlert.create({
        tenant_id: booking.tenant_id,
        booking_id,
        driver_id,
        customer_id: booking.customer_id._id,
        alert_type: "eta_update",
        message: `ETA: ${eta_minutes} minutes`,
        location: {
          type: "Point",
          coordinates: [current_lng, current_lat],
        },
        metadata: {
          distance_to_pickup: parseFloat(distance_to_pickup.toFixed(2)),
          eta_minutes,
        },
        sent: false,
      });
    }

    return {
      distance_to_pickup: parseFloat(distance_to_pickup.toFixed(2)),
      eta_minutes,
    };
  } catch (err) {
    console.error("Error processing geo alerts:", err);
    return null;
  }
};

// Check route deviation
exports.checkRouteDeviation = async (
  booking_id,
  driver_id,
  current_lat,
  current_lng
) => {
  try {
    const booking = await DriverBooking.findById(booking_id).populate(
      "customer_id"
    );

    if (!booking || booking.status !== "trip_in_progress") return;

    // Get last few location points to determine expected route
    const recentLocations = await LocationTracking.find({
      job_id: booking_id,
    })
      .sort({ timestamp: -1 })
      .limit(5)
      .lean();

    if (recentLocations.length < 3) return;

    // Simple deviation check: if driver moves significantly away from the general direction
    const drop_lat = booking.locations.drop?.lat;
    const drop_lng = booking.locations.drop?.lng;

    if (!drop_lat || !drop_lng) return;

    // Calculate distance to destination
    const current_distance = calculateDistance(
      current_lat,
      current_lng,
      drop_lat,
      drop_lng
    );

    // Get previous distance
    const prev_location = recentLocations[1];
    const [prev_lng, prev_lat] = prev_location.location.coordinates;
    const prev_distance = calculateDistance(
      prev_lat,
      prev_lng,
      drop_lat,
      drop_lng
    );

    // If moving away from destination significantly (more than 1km increase)
    const deviation = current_distance - prev_distance;

    if (deviation > 1) {
      const existingAlert = await GeoAlert.findOne({
        booking_id,
        alert_type: "driver_deviating_route",
        createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }, // Last 5 minutes
      });

      if (!existingAlert) {
        const alert = await GeoAlert.create({
          tenant_id: booking.tenant_id,
          booking_id,
          driver_id,
          customer_id: booking.customer_id._id,
          alert_type: "driver_deviating_route",
          message: "Driver may have deviated from the expected route",
          location: {
            type: "Point",
            coordinates: [current_lng, current_lat],
          },
          metadata: {
            deviation_distance_km: parseFloat(deviation.toFixed(2)),
          },
          sent: true,
          sent_at: new Date(),
        });

        // Send notification to customer
        await sendNotification({
          tenant_id: booking.tenant_id,
          user_id: booking.customer_id._id,
          title: "Route Update",
          message: alert.message,
          type: "geo_alert",
          data: { booking_id, alert_type: "driver_deviating_route" },
        });
      }
    }
  } catch (err) {
    console.error("Error checking route deviation:", err);
  }
};

// Get alerts for a booking
exports.getBookingAlerts = async (req, res) => {
  try {
    const alerts = await GeoAlert.find({
      booking_id: req.params.booking_id,
      tenant_id: req.tenantId,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { alerts, count: alerts.length },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { message: err.message },
    });
  }
};

// Get recent alerts for driver
exports.getDriverAlerts = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const alerts = await GeoAlert.find({
      driver_id: req.params.driver_id,
      tenant_id: req.tenantId,
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate("booking_id", "booking_number status");

    res.json({
      success: true,
      data: { alerts, count: alerts.length },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { message: err.message },
    });
  }
};

module.exports.processGeoAlerts = exports.processGeoAlerts;
module.exports.checkRouteDeviation = exports.checkRouteDeviation;
