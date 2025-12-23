const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    profile: {
      first_name: { type: String, required: true, trim: true },
      last_name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, trim: true, lowercase: true },
      avatar_url: String,
      date_of_birth: Date,
      gender: { type: String, enum: ["male", "female", "other"] },
    },
    addresses: [
      {
        address_id: String,
        label: { type: String, enum: ["home", "work", "other"] },
        line1: String,
        line2: String,
        city: String,
        state: String,
        pincode: String,
        location: {
          type: { type: String, enum: ["Point"], default: "Point" },
          coordinates: { type: [Number], index: "2dsphere" },
        },
        is_default: { type: Boolean, default: false },
      },
    ],
    roles: [
      {
        role: {
          type: String,
          enum: ["customer", "provider", "dispatcher", "admin", "super_admin"],
          required: true,
        },
        status: {
          type: String,
          enum: ["active", "inactive", "suspended"],
          default: "active",
        },
        joined_at: { type: Date, default: Date.now },
        provider_details: {
          services: [String],
          experience_years: Number,
          certifications: [String],
          documents: {
            id_proof: String,
            address_proof: String,
            license: String,
          },
          verification_status: {
            type: String,
            enum: ["pending", "verified", "rejected"],
            default: "pending",
          },
          verified_at: Date,
          verified_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        },
      },
    ],
    payment_accounts: {
      razorpay_account_id: String,
      bank_details: {
        account_holder_name: String,
        account_number: String,
        ifsc_code: String,
        bank_name: String,
        branch: String,
        upi_id: String,
      },
      pan: String,
      gstin: String,
    },
    stats: {
      total_jobs: { type: Number, default: 0 },
      completed_jobs: { type: Number, default: 0 },
      cancelled_jobs: { type: Number, default: 0 },
      average_rating: { type: Number, default: 0, min: 0, max: 5 },
      total_earnings: { type: Number, default: 0 },
      on_time_percentage: { type: Number, default: 100 },
    },
    availability: {
      is_available: { type: Boolean, default: false },
      current_location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], index: "2dsphere" },
      },
      updated_at: Date,
      working_hours: {
        monday: { start: String, end: String },
        tuesday: { start: String, end: String },
        wednesday: { start: String, end: String },
        thursday: { start: String, end: String },
        friday: { start: String, end: String },
        saturday: { start: String, end: String, off: Boolean },
        sunday: { off: { type: Boolean, default: true } },
      },
    },
    auth: {
      password_hash: { type: String, required: true },
      phone_verified: { type: Boolean, default: false },
      email_verified: { type: Boolean, default: false },
      last_login: Date,
      fcm_tokens: [String],
      refresh_token: String,
    },
    preferences: {
      language: { type: String, default: "en" },
      notifications: {
        push: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
        email: { type: Boolean, default: false },
        whatsapp: { type: Boolean, default: true },
      },
      theme: { type: String, default: "light" },
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended", "blocked"],
      default: "active",
    },
  },
  { timestamps: true }
);

userSchema.index({ tenant_id: 1, "profile.phone": 1 }, { unique: true });
userSchema.index({ tenant_id: 1, "profile.email": 1 });
userSchema.index({ tenant_id: 1, "roles.role": 1 });
userSchema.index({ "availability.current_location": "2dsphere" });
userSchema.index({ status: 1 });

userSchema.pre("save", async function (next) {
  if (!this.isModified("auth.password_hash")) return next();
  const salt = await bcrypt.genSalt(10);
  this.auth.password_hash = await bcrypt.hash(this.auth.password_hash, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.auth.password_hash);
};

userSchema.methods.hasRole = function (roleName) {
  return this.roles.some((r) => r.role === roleName && r.status === "active");
};

module.exports = mongoose.model("User", userSchema);
