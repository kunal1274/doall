exports.validateTenant = (req, res, next) => {
  // Simple tenant resolver: header 'x-tenant-id' or query param
  req.tenantId = req.headers["x-tenant-id"] || req.query.tenant_id || null;
  next();
};

exports.ensureTenantAccess = (req, res, next) => {
  if (!req.tenantId)
    return res
      .status(400)
      .json({ success: false, error: { message: "Tenant not specified" } });
  if (
    req.user &&
    req.user.tenant_id &&
    req.user.tenant_id.toString() !== req.tenantId.toString()
  ) {
    return res
      .status(403)
      .json({ success: false, error: { message: "Access to tenant denied" } });
  }
  next();
};
