const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
  tenant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    index: true,
  },
  job_id: { type: mongoose.Schema.Types.ObjectId, ref: "Job", index: true },
  provider_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true,
  },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], index: "2dsphere" },
  },
  accuracy: Number,
  speed: Number,
  heading: Number,
  status: String,
  timestamp: { type: Date, default: Date.now },
});

locationSchema.index({ job_id: 1, timestamp: -1 });
locationSchema.index({ provider_id: 1, timestamp: -1 });
locationSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("LocationTracking", locationSchema);
