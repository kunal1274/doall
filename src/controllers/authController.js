const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.register = async (req, res) => {
  try {
    const { phone, first_name, last_name, password, role, email } = req.body;
    const user = await User.create({
      tenant_id: req.tenantId,
      profile: { first_name, last_name, phone, email },
      auth: { password_hash: password },
      roles: [{ role }],
    });
    res.json({ success: true, data: { user } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = await User.findOne({ "profile.phone": phone });
    if (!user)
      return res
        .status(401)
        .json({ success: false, error: { message: "Invalid credentials" } });
    const valid = await user.comparePassword(password);
    if (!valid)
      return res
        .status(401)
        .json({ success: false, error: { message: "Invalid credentials" } });

    const token = jwt.sign(
      { userId: user._id, tenantId: user.tenant_id, role: user.roles[0]?.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "24h" }
    );
    res.json({ success: true, data: { accessToken: token } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

exports.sendOTP = async (req, res) => {
  // Placeholder - integrate Twilio or OTP provider
  res.json({
    success: true,
    data: { otp_id: "otp_dummy", message: "OTP sent (stub)" },
  });
};

exports.verifyOTP = async (req, res) => {
  // Placeholder
  res.json({ success: true, data: { token: "dummy_token" } });
};

exports.refreshToken = async (req, res) => {
  res.json({ success: true, data: { accessToken: "new_dummy_token" } });
};

exports.logout = async (req, res) => {
  res.json({ success: true, data: { message: "Logged out" } });
};
