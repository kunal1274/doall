const LocationTracking = require("../models/LocationTracking");
const Job = require("../models/Job");

exports.updateLocation = async (req, res) => {
  try {
    const { job_id, latitude, longitude, status } = req.body;
    const loc = await LocationTracking.create({
      tenant_id: req.tenantId,
      job_id,
      provider_id: req.userId,
      location: { type: "Point", coordinates: [longitude, latitude] },
      status,
      timestamp: new Date(),
    });
    res.json({ success: true, data: { location: loc } });
  } catch (err) {
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
