const Razorpay = require("razorpay");

exports.webhook = async (req, res) => {
  // Verify webhook signature externally before processing
  res.status(200).send("ok");
};

exports.createOrder = async (req, res) => {
  res.json({ success: true, data: { order: null } });
};

exports.verifyPayment = async (req, res) => {
  res.json({ success: true, data: { verified: true } });
};

exports.getPaymentHistory = async (req, res) => {
  res.json({ success: true, data: { items: [] } });
};
