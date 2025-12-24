const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    vehicle_type: {
      type: String,
      enum: ["car", "suv", "sedan", "hatchback", "luxury"],
      required: true,
    },
    details: {
      brand: { type: String, required: true },
      model: { type: String, required: true },
      year: Number,
      color: String,
      registration_number: { type: String, required: true, unique: true },
      fuel_type: {
        type: String,
        enum: ["petrol", "diesel", "electric", "hybrid", "cng"],
      },
      transmission: {
        type: String,
        enum: ["manual", "automatic"],
      },
    },
    insurance: {
      policy_number: String,
      provider: String,
      expiry_date: Date,
      document_url: String,
    },
    rc_details: {
      rc_number: String,
      owner_name: String,
      document_url: String,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "maintenance", "sold"],
      default: "active",
    },
    verification: {
      status: {
        type: String,
        enum: ["pending", "verified", "rejected"],
        default: "pending",
      },
      verified_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      verified_at: Date,
      notes: String,
    },
    photos: [
      {
        url: String,
        type: { type: String, enum: ["front", "back", "side", "interior"] },
        uploaded_at: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
vehicleSchema.index({ tenant_id: 1, customer_id: 1 });
vehicleSchema.index({ registration_number: 1 });

module.exports = mongoose.model("Vehicle", vehicleSchema);
