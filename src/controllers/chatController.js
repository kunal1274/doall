const ChatMessage = require("../models/ChatMessage");

exports.getMessages = async (req, res) => {
  try {
    const messages = await ChatMessage.find({ job_id: req.params.job_id })
      .sort({ timestamp: 1 })
      .lean();
    res.json({ success: true, data: { messages } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { content, message_type, recipient_id } = req.body;
    const msg = await ChatMessage.create({
      tenant_id: req.tenantId,
      job_id: req.params.job_id,
      sender_id: req.userId,
      sender_role: req.user?.roles?.[0]?.role || "customer",
      recipient_id,
      message: { type: message_type, content },
      timestamp: new Date(),
    });
    res.json({ success: true, data: { message: msg } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { message_ids } = req.body;
    await ChatMessage.updateMany(
      { _id: { $in: message_ids }, recipient_id: req.userId },
      { read: true, read_at: new Date() }
    );
    res.json({ success: true, message: "Messages marked as read" });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};
