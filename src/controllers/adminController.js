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

exports.updateCommissionConfig = async (req, res) => {
  try {
    const { platform_fee, dispatcher_cut, admin_cut, provider_cut } = req.body;
    const total =
      (platform_fee || 0) +
      (dispatcher_cut || 0) +
      (admin_cut || 0) +
      (provider_cut || 0);

    if (Math.abs(total - 100) > 0.01) {
      return res
        .status(400)
        .json({
          success: false,
          error: { message: "Commission percentages must total 100%" },
        });
    }

    const tenant = await Tenant.findById(req.tenantId);
    if (!tenant) {
      return res
        .status(404)
        .json({ success: false, error: { message: "Tenant not found" } });
    }

    tenant.commission_config.platform_fee = platform_fee;
    tenant.commission_config.dispatcher_cut = dispatcher_cut;
    tenant.commission_config.admin_cut = admin_cut;
    tenant.commission_config.provider_cut = provider_cut;

    await tenant.save();
    res.json({ success: true, message: "Commission config updated" });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};
