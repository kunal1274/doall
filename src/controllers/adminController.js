const User = require("../models/User");
const Job = require("../models/Job");
const Tenant = require("../models/Tenant");

exports.getDashboardStats = async (req, res) => {
  try {
    const counts = {
      users: await User.countDocuments({ tenant_id: req.tenantId }),
      jobs: await Job.countDocuments({ tenant_id: req.tenantId }),
      providers: await User.countDocuments({
        tenant_id: req.tenantId,
        "roles.role": "provider",
      }),
    };
    res.json({ success: true, data: counts });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ tenant_id: req.tenantId })
      .limit(100)
      .lean();
    res.json({ success: true, data: { users } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

exports.verifyProvider = async (req, res) => {
  try {
    const { verification_status } = req.body;
    const user = await User.findOne({
      _id: req.params.user_id,
      tenant_id: req.tenantId,
    });
    if (!user)
      return res
        .status(404)
        .json({ success: false, error: { message: "User not found" } });
    const providerRole = user.roles.find((r) => r.role === "provider");
    if (!providerRole)
      return res
        .status(400)
        .json({ success: false, error: { message: "Not a provider" } });
    providerRole.provider_details.verification_status = verification_status;
    if (verification_status === "verified")
      providerRole.provider_details.verified_at = new Date();
    await user.save();
    res.json({ success: true, message: "Verification status updated" });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const user = await User.findOne({
      _id: req.params.user_id,
      tenant_id: req.tenantId,
    });
    if (!user)
      return res
        .status(404)
        .json({ success: false, error: { message: "User not found" } });
    user.status = status;
    await user.save();
    res.json({ success: true, message: "User status updated" });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};
