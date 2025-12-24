const mongoose = require("mongoose");

const geoAlertSchema = new mongoose.Schema(
  {
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DriverBooking",
      required: true,
      index: true,
    },
    driver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    alert_type: {
      type: String,
      enum: [
        "driver_entering_service_area",
        "driver_leaving_service_area",
        "driver_approaching_pickup",
        "driver_deviating_route",
        "driver_arrived",
        "eta_update",
      ],
      required: true,
    },
    message: String,
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: [Number],
    },
    metadata: {
      distance_to_pickup: Number,
      eta_minutes: Number,
      deviation_distance_km: Number,
    },
    sent: {
      type: Boolean,
      default: false,
    },
    sent_at: Date,
  },
  {
    timestamps: true,
  }
);

geoAlertSchema.index({ booking_id: 1, alert_type: 1 });
geoAlertSchema.index({ driver_id: 1, createdAt: -1 });
geoAlertSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("GeoAlert", geoAlertSchema);
