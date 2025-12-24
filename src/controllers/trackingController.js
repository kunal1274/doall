const LocationTracking = require("../models/LocationTracking");
const Job = require("../models/Job");
const DriverBooking = require("../models/DriverBooking");
const logger = require("../config/logger");
const {
  processGeoAlerts,
  checkRouteDeviation,
} = require("../services/geoAlertService");

exports.updateLocation = async (req, res) => {
  try {
    const { job_id, latitude, longitude, status, accuracy, speed, heading } =
      req.body;

    logger.info(`Location update for job ${job_id}: ${latitude}, ${longitude}, speed: ${speed || 0}km/h`);

    const loc = await LocationTracking.create({
      tenant_id: req.tenantId,
      job_id,
      provider_id: req.userId,
      location: { type: "Point", coordinates: [longitude, latitude] },
      accuracy,
      speed,
      heading,
      status,
      timestamp: new Date(),
    });

    // Process geo alerts for driver bookings
    const booking = await DriverBooking.findById(job_id);
    if (
      booking &&
      ["driver_en_route", "driver_assigned", "trip_in_progress"].includes(
        booking.status
      )
    ) {
      try {
        // Process alerts (approaching, arrived, ETA)
        await processGeoAlerts(job_id, req.userId, latitude, longitude);
        logger.debug(`Geo-alerts processed for booking ${job_id}`);

        // Check route deviation for active trips
        if (booking.status === "trip_in_progress") {
          await checkRouteDeviation(job_id, req.userId, latitude, longitude);
        }
      } catch (alertError) {
        logger.warn(`Geo-alert processing warning: ${alertError.message}`);
      }
    }

    res.json({ success: true, data: { location: loc } });
  } catch (err) {
    logger.logError(err, "updateLocation");
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

exports.getLiveLocation = async (req, res) => {
  try {
    const last = await LocationTracking.findOne({ job_id: req.params.job_id })
      .sort({ timestamp: -1 })
      .lean();
    if (!last)
      return res
        .status(404)
        .json({ success: false, error: { message: "No location found" } });
    res.json({ success: true, data: { location: last } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

exports.getRouteHistory = async (req, res) => {
  try {
    const points = await LocationTracking.find({ job_id: req.params.job_id })
      .sort({ timestamp: 1 })
      .lean();
    res.json({ success: true, data: { route: points } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};
