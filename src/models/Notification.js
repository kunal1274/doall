const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      index: true,
    },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    type: String,
    channel: String,
    title: String,
    body: String,
    data: mongoose.Schema.Types.Mixed,
    status: { type: String, default: "sent" },
    sent_at: Date,
    delivered_at: Date,
    read_at: Date,
    error: String,
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("Notification", notificationSchema);
