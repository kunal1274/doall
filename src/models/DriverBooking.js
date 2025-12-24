const mongoose = require("mongoose");

const driverBookingSchema = new mongoose.Schema(
  {
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    booking_number: {
      type: String,
      required: true,
      unique: true,
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    vehicle_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    driver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      index: true,
    },
    locations: {
      pickup: {
        address: String,
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        landmark: String,
      },
      drop: {
        address: String,
        lat: Number,
        lng: Number,
        landmark: String,
      },
    },
    service_type: {
      type: String,
      enum: ["4hr", "8hr", "fullday", "outstation"],
      required: true,
    },
    schedule: {
      booking_time: { type: Date, default: Date.now },
      scheduled_for: { type: Date, required: true },
      preferred_time_slot: String,
      is_immediate: { type: Boolean, default: false },
    },
    trip_details: {
      trip_pin: { type: String, required: true },
      start_time: Date,
      end_time: Date,
      start_odometer: Number,
      end_odometer: Number,
      total_km: Number,
      total_minutes: Number,
      extra_minutes: Number,
      route_coordinates: [
        {
          lat: Number,
          lng: Number,
          timestamp: Date,
        },
      ],
    },
    status: {
      type: String,
      enum: [
        "requested",
        "searching_driver",
        "driver_assigned",
        "driver_en_route",
        "driver_arrived",
        "trip_started",
        "trip_in_progress",
        "trip_completed",
        "payment_pending",
        "payment_done",
        "closed",
        "cancelled",
      ],
      default: "requested",
    },
    status_history: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        updated_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        notes: String,
      },
    ],
    pricing: {
      base_fare: { type: Number, required: true },
      extra_hours_charge: { type: Number, default: 0 },
      night_charge: { type: Number, default: 0 },
      emergency_charge: { type: Number, default: 0 },
      toll_parking: { type: Number, default: 0 },
      subtotal: Number,
      gst: Number,
      discount: { type: Number, default: 0 },
      promo_code: String,
      final_amount: Number,
      currency: { type: String, default: "INR" },
    },
    payment: {
      method: {
        type: String,
        enum: ["cash", "online", "wallet", "card"],
      },
      status: {
        type: String,
        enum: ["pending", "processing", "success", "failed", "refunded"],
        default: "pending",
      },
      transaction_id: String,
      paid_amount: Number,
      paid_at: Date,
    },
    ratings: {
      by_customer: {
        rating: { type: Number, min: 1, max: 5 },
        review: String,
        rated_at: Date,
      },
      by_driver: {
        rating: { type: Number, min: 1, max: 5 },
        review: String,
        rated_at: Date,
      },
    },
    cancellation: {
      cancelled_by: {
        type: String,
        enum: ["customer", "driver", "admin"],
      },
      reason: String,
      cancelled_at: Date,
      refund_amount: Number,
    },
    notes: {
      customer_notes: String,
      driver_notes: String,
      admin_notes: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
driverBookingSchema.index({ tenant_id: 1, customer_id: 1 });
driverBookingSchema.index({ driver_id: 1, status: 1 });
driverBookingSchema.index({ booking_number: 1 });
driverBookingSchema.index({ "schedule.scheduled_for": 1 });

// Generate booking number
driverBookingSchema.pre("save", async function (next) {
  if (!this.booking_number) {
    const count = await mongoose.model("DriverBooking").countDocuments();
    this.booking_number = `DB${Date.now()}${(count + 1)
      .toString()
      .padStart(4, "0")}`;
  }
  next();
});

module.exports = mongoose.model("DriverBooking", driverBookingSchema);
