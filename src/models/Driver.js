const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    license_details: {
      license_number: { type: String, required: true },
      license_expiry: Date,
      license_photo_url: String,
      verification_status: {
        type: String,
        enum: ["pending", "verified", "rejected"],
        default: "pending",
      },
    },
    vehicle_preference: {
      type: String,
      enum: ["car", "suv", "bike", "auto"],
      default: "car",
    },
    experience_years: { type: Number, default: 0 },
    home_location: {
      address: String,
      coordinates: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], index: "2dsphere" },
      },
    },
    travel_mode: {
      type: String,
      enum: ["bike", "auto", "metro", "walk", "own_vehicle"],
      default: "own_vehicle",
    },
    performance: {
      rating_avg: { type: Number, default: 0, min: 0, max: 5 },
      total_trips: { type: Number, default: 0 },
      completed_trips: { type: Number, default: 0 },
      cancelled_trips: { type: Number, default: 0 },
      acceptance_rate: { type: Number, default: 100 },
    },
    registration: {
      fee_paid: { type: Boolean, default: false },
      fee_amount: Number,
      valid_till: Date,
      payment_id: String,
    },
    availability: {
      status: {
        type: String,
        enum: ["online", "offline", "busy", "break"],
        default: "offline",
      },
      last_online: Date,
      current_location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: [Number], // [longitude, latitude]
        lat: Number,
        lng: Number,
        updated_at: Date,
      },
      service_zone_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ServiceArea",
      },
    },
    earnings: {
      today: { type: Number, default: 0 },
      this_week: { type: Number, default: 0 },
      this_month: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      pending_settlement: { type: Number, default: 0 },
    },
    documents: {
      aadhaar: { url: String, verified: Boolean },
      pan: { url: String, verified: Boolean },
      police_verification: { url: String, verified: Boolean },
    },
    emergency_contact: {
      name: String,
      phone: String,
      relationship: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
driverSchema.index({ tenant_id: 1, "availability.status": 1 });
driverSchema.index({ "home_location.coordinates": "2dsphere" });
driverSchema.index({ "availability.current_location": "2dsphere" });

module.exports = mongoose.model("Driver", driverSchema);
