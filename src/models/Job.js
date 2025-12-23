const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    job_number: { type: String, required: true, unique: true },
    service_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    service_name: String,
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    provider_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    dispatcher_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    location: {
      address: {
        line1: String,
        line2: String,
        city: String,
        state: String,
        pincode: String,
      },
      coordinates: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], index: "2dsphere" },
      },
      landmark: String,
    },
    schedule: {
      booking_type: {
        type: String,
        enum: ["instant", "scheduled"],
        default: "scheduled",
      },
      preferred_date: Date,
      preferred_time_slot: String,
      actual_start_time: Date,
      actual_end_time: Date,
      duration_minutes: Number,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "assigned",
        "accepted",
        "on_the_way",
        "in_progress",
        "completed",
        "cancelled",
        "disputed",
      ],
      default: "pending",
      index: true,
    },
    status_history: [
      {
        status: String,
        timestamp: Date,
        updated_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
    pricing: {
      base_charge: Number,
      hourly_rate: Number,
      hours_worked: Number,
      labor_cost: Number,
      materials: [
        {
          material_id: String,
          name: String,
          quantity: Number,
          unit_price: Number,
          total: Number,
        },
      ],
      materials_total: { type: Number, default: 0 },
      peak_hour_surcharge: { type: Number, default: 0 },
      emergency_surcharge: { type: Number, default: 0 },
      distance_charge: { type: Number, default: 0 },
      subtotal: Number,
      gst: {
        cgst_percentage: Number,
        sgst_percentage: Number,
        igst_percentage: Number,
        cgst_amount: Number,
        sgst_amount: Number,
        igst_amount: Number,
        total_gst: Number,
      },
      late_fine: {
        expected_completion: Date,
        actual_completion: Date,
        delay_minutes: Number,
        grace_period_minutes: Number,
        chargeable_minutes: Number,
        penalty_per_minute: Number,
        total_penalty: Number,
        applied_to: String,
      },
      total_amount: Number,
      commission_split: {
        platform_fee_percentage: Number,
        platform_fee_amount: Number,
        dispatcher_percentage: Number,
        dispatcher_amount: Number,
        admin_percentage: Number,
        admin_amount: Number,
        provider_percentage: Number,
        provider_gross_amount: Number,
        late_fine_deduction: Number,
        provider_net_amount: Number,
      },
      currency: { type: String, default: "INR" },
    },
    payment: {
      method: { type: String, enum: ["cash", "online", "wallet"] },
      gateway: String,
      razorpay_order_id: String,
      razorpay_payment_id: String,
      status: {
        type: String,
        enum: ["pending", "processing", "completed", "failed", "refunded"],
        default: "pending",
      },
      paid_at: Date,
      transfers: [
        {
          recipient: String,
          account_id: String,
          amount: Number,
          transfer_id: String,
          status: String,
        },
      ],
      refund: {
        refund_id: String,
        amount: Number,
        reason: String,
        refunded_at: Date,
      },
    },
    invoice: {
      invoice_number: String,
      invoice_url: String,
      generated_at: Date,
      sent_to_customer: { type: Boolean, default: false },
      sent_via: [String],
    },
    rating: {
      overall_rating: { type: Number, min: 1, max: 5 },
      punctuality_rating: { type: Number, min: 1, max: 5 },
      quality_rating: { type: Number, min: 1, max: 5 },
      behavior_rating: { type: Number, min: 1, max: 5 },
      review: String,
      rated_at: Date,
    },
    customer_notes: String,
    provider_notes: String,
    photos: { before: [String], after: [String] },
    cancellation: {
      cancelled: { type: Boolean, default: false },
      cancelled_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      cancelled_at: Date,
      cancellation_reason: String,
      cancellation_fee: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

jobSchema.index({ tenant_id: 1, job_number: 1 }, { unique: true });
jobSchema.index({ tenant_id: 1, customer_id: 1, createdAt: -1 });
jobSchema.index({ tenant_id: 1, provider_id: 1, createdAt: -1 });
jobSchema.index({ tenant_id: 1, status: 1 });
jobSchema.index({ "location.coordinates": "2dsphere" });
jobSchema.index({ "schedule.preferred_date": 1 });

jobSchema.pre("save", async function (next) {
  if (this.isNew) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      tenant_id: this.tenant_id,
    });
    this.job_number = `JOB-${year}-${String(count + 1).padStart(6, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Job", jobSchema);
