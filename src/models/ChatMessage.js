const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  tenant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    index: true,
  },
  job_id: { type: mongoose.Schema.Types.ObjectId, ref: "Job", index: true },
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  sender_role: String,
  recipient_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  recipient_role: String,
  message: {
    type: {
      type: String,
      enum: ["text", "image", "location", "file"],
      default: "text",
    },
    content: String,
    media_url: String,
    thumbnail_url: String,
    file_name: String,
    file_size: Number,
    location: mongoose.Schema.Types.Mixed,
  },
  read: { type: Boolean, default: false },
  read_at: Date,
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ChatMessage", chatSchema);
