const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true },
    category: {
      type: String,
      enum: [
        "home_services",
        "mobility",
        "maintenance",
        "construction",
        "professional",
      ],
      required: true,
    },
    description: String,
    icon_url: String,
    pricing: {
      type: {
        type: String,
        enum: ["hourly", "fixed", "distance_based", "material_based"],
        required: true,
      },
      base_rate: { type: Number, required: true },
      minimum_charge: { type: Number, required: true },
      currency: { type: String, default: "INR" },
      peak_hours: {
        enabled: { type: Boolean, default: false },
        hours: [String],
        surcharge_percentage: Number,
      },
      emergency: {
        enabled: { type: Boolean, default: false },
        surcharge_percentage: Number,
      },
      distance_pricing: { base_distance_km: Number, per_km_charge: Number },
    },
    materials: [
      { material_id: String, name: String, price: Number, unit: String },
    ],
    booking_questions: [
      {
        question_id: String,
        question: String,
        type: {
          type: String,
          enum: ["text", "multiple_choice", "file_upload"],
        },
        options: [String],
        required: Boolean,
      },
    ],
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

serviceSchema.index({ tenant_id: 1, slug: 1 }, { unique: true });
serviceSchema.index({ tenant_id: 1, category: 1 });
serviceSchema.index({ status: 1 });

module.exports = mongoose.model("Service", serviceSchema);
