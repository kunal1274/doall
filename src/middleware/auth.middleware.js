const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  let token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];
  if (!token)
    return res
      .status(401)
      .json({ success: false, error: { message: "Not authorized" } });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.tenantId = decoded.tenantId;
    req.user = await User.findById(req.userId);
    next();
  } catch (err) {
    res
      .status(401)
      .json({ success: false, error: { message: "Token invalid or expired" } });
  }
};

exports.authorize =
  (...roles) =>
  (req, res, next) => {
    const userRoles = req.user?.roles?.map((r) => r.role) || [];
    const allowed = roles.some((r) => userRoles.includes(r));
    if (!allowed)
      return res
        .status(403)
        .json({ success: false, error: { message: "Forbidden" } });
    next();
  };
