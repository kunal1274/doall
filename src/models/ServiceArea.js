const mongoose = require("mongoose");

const serviceAreaSchema = new mongoose.Schema(
  {
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    zone_code: {
      type: String,
      unique: true,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: String,
    country: { type: String, default: "India" },
    area_type: {
      type: String,
      enum: ["polygon", "radius", "city"],
      required: true,
    },
    boundaries: {
      polygon: {
        type: {
          type: String,
          enum: ["Polygon"],
        },
        coordinates: {
          type: [[[Number]]],
        },
      },
      radius: {
        center: {
          type: { type: String, enum: ["Point"] },
          coordinates: [Number],
        },
        radius_km: Number,
      },
    },
    pricing: {
      base_fare: { type: Number, required: true },
      per_km_charge: Number,
      per_minute_charge: Number,
      night_surcharge_percent: { type: Number, default: 0 },
      peak_hour_surcharge_percent: { type: Number, default: 0 },
      min_fare: Number,
    },
    active: {
      type: Boolean,
      default: true,
    },
    service_hours: {
      always_available: { type: Boolean, default: true },
      hours: [
        {
          day: {
            type: String,
            enum: [
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
              "sunday",
            ],
          },
          start_time: String,
          end_time: String,
        },
      ],
    },
    max_distance_km: {
      type: Number,
      default: 50,
    },
  },
  {
    timestamps: true,
  }
);

serviceAreaSchema.index({ "boundaries.polygon": "2dsphere" });
serviceAreaSchema.index({ "boundaries.radius.center": "2dsphere" });
serviceAreaSchema.index({ tenant_id: 1, active: 1 });
serviceAreaSchema.index({ zone_code: 1 });

module.exports = mongoose.model("ServiceArea", serviceAreaSchema);
