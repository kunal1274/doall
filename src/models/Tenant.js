const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    domain: { type: String, trim: true },
    business: {
      gstin: String,
      pan: String,
      registration_number: String,
      address: {
        line1: String,
        line2: String,
        city: String,
        state: String,
        pincode: String,
        country: { type: String, default: "India" },
      },
      contact: {
        phone: String,
        email: String,
        website: String,
      },
    },
    commission_config: {
      platform_fee: { type: Number, default: 1.0 },
      dispatcher_cut: { type: Number, default: 2.0 },
      admin_cut: { type: Number, default: 18.0 },
      provider_cut: { type: Number, default: 79.0 },
      service_specific: {
        type: Map,
        of: {
          platform_fee: Number,
          dispatcher_cut: Number,
          admin_cut: Number,
          provider_cut: Number,
        },
      },
    },
    payment_config: {
      razorpay: {
        key_id: String,
        key_secret: String,
        webhook_secret: String,
        accounts: {
          admin: String,
          default_dispatcher: String,
        },
      },
      phonepe: {
        merchant_id: String,
        salt_key: String,
        enabled: { type: Boolean, default: false },
      },
    },
    late_fine_config: {
      enabled: { type: Boolean, default: true },
      grace_period_minutes: { type: Number, default: 15 },
      penalty_per_minute: { type: Number, default: 10 },
      max_penalty_amount: { type: Number, default: 500 },
      deduct_from: {
        type: String,
        enum: ["provider", "customer"],
        default: "provider",
      },
      auto_calculate: { type: Boolean, default: true },
    },
    services: [
      {
        service_id: String,
        name: String,
        pricing: {
          type: { type: String, enum: ["hourly", "fixed", "distance_based"] },
          base_rate: Number,
          minimum_charge: Number,
          currency: { type: String, default: "INR" },
        },
        emergency_surcharge: Number,
        peak_hours_surcharge: Number,
      },
    ],
    subscription: {
      plan: {
        type: String,
        enum: ["free", "basic", "premium", "enterprise"],
        default: "basic",
      },
      valid_until: Date,
      limits: {
        max_providers: Number,
        max_customers: Number,
        max_jobs_per_month: Number,
      },
    },
    settings: {
      timezone: { type: String, default: "Asia/Kolkata" },
      currency: { type: String, default: "INR" },
      language: { type: String, default: "en" },
      notifications: {
        sms_enabled: { type: Boolean, default: true },
        email_enabled: { type: Boolean, default: true },
        whatsapp_enabled: { type: Boolean, default: false },
      },
      features: {
        live_tracking: { type: Boolean, default: true },
        chat: { type: Boolean, default: true },
        gst_billing: { type: Boolean, default: true },
        auto_assignment: { type: Boolean, default: false },
      },
    },
    status: {
      type: String,
      enum: ["active", "suspended", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

tenantSchema.index({ slug: 1 }, { unique: true });
tenantSchema.index({ "business.gstin": 1 });
tenantSchema.index({ status: 1 });

tenantSchema.pre("save", function (next) {
  const total =
    (this.commission_config.platform_fee || 0) +
    (this.commission_config.dispatcher_cut || 0) +
    (this.commission_config.admin_cut || 0) +
    (this.commission_config.provider_cut || 0);
  if (Math.abs(total - 100) > 0.01) {
    return next(new Error("Commission percentages must total 100%"));
  }
  next();
});

module.exports = mongoose.model("Tenant", tenantSchema);
