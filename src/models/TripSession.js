const mongoose = require("mongoose");

const tripSessionSchema = new mongoose.Schema(
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
      unique: true,
    },
    driver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },
    trip_pin: {
      type: String,
      required: true,
      minlength: 4,
      maxlength: 6,
    },
    session_data: {
      start_time: Date,
      end_time: Date,
      start_location: {
        lat: Number,
        lng: Number,
        address: String,
      },
      end_location: {
        lat: Number,
        lng: Number,
        address: String,
      },
      duration: {
        planned_minutes: Number,
        actual_minutes: Number,
        extra_minutes: Number,
      },
      distance: {
        planned_km: Number,
        actual_km: Number,
      },
    },
    tracking: {
      live_location: {
        lat: Number,
        lng: Number,
        updated_at: Date,
      },
      location_history: [
        {
          lat: Number,
          lng: Number,
          timestamp: Date,
          speed: Number,
        },
      ],
    },
    stops: [
      {
        location: {
          lat: Number,
          lng: Number,
          address: String,
        },
        arrival_time: Date,
        departure_time: Date,
        duration_minutes: Number,
        purpose: String,
      },
    ],
    incidents: [
      {
        type: {
          type: String,
          enum: ["accident", "breakdown", "fuel", "other"],
        },
        description: String,
        location: {
          lat: Number,
          lng: Number,
        },
        timestamp: Date,
        resolved: { type: Boolean, default: false },
      },
    ],
    status: {
      type: String,
      enum: ["pending", "started", "paused", "completed", "cancelled"],
      default: "pending",
    },
    verification: {
      pin_verified: { type: Boolean, default: false },
      verified_at: Date,
      verified_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
tripSessionSchema.index({ tenant_id: 1, booking_id: 1 });
tripSessionSchema.index({ driver_id: 1, status: 1 });

// Generate 4-digit PIN
tripSessionSchema.pre("save", function (next) {
  if (!this.trip_pin) {
    this.trip_pin = Math.floor(1000 + Math.random() * 9000).toString();
  }
  next();
});

module.exports = mongoose.model("TripSession", tripSessionSchema);
