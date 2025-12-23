const Service = require("../models/Service");

exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.find({ tenant_id: req.tenantId }).lean();
    res.json({ success: true, data: { services } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

exports.getCategories = async (req, res) => {
  res.json({
    success: true,
    data: {
      categories: [
        "home_services",
        "mobility",
        "maintenance",
        "construction",
        "professional",
      ],
    },
  });
};

exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findOne({
      _id: req.params.service_id,
      tenant_id: req.tenantId,
    });
    if (!service)
      return res
        .status(404)
        .json({ success: false, error: { message: "Service not found" } });
    res.json({ success: true, data: { service } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

exports.createService = async (req, res) => {
  try {
    const payload = req.body;
    payload.tenant_id = req.tenantId;
    const service = await Service.create(payload);
    res.status(201).json({ success: true, data: { service } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

exports.updateService = async (req, res) => {
  try {
    const service = await Service.findOneAndUpdate(
      { _id: req.params.service_id, tenant_id: req.tenantId },
      req.body,
      { new: true }
    );
    if (!service)
      return res
        .status(404)
        .json({ success: false, error: { message: "Service not found" } });
    res.json({ success: true, data: { service } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

exports.deleteService = async (req, res) => {
  try {
    await Service.deleteOne({
      _id: req.params.service_id,
      tenant_id: req.tenantId,
    });
    res.json({ success: true, message: "Service deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

exports.addMaterial = async (req, res) => {
  try {
    const service = await Service.findOne({
      _id: req.params.service_id,
      tenant_id: req.tenantId,
    });
    if (!service)
      return res
        .status(404)
        .json({ success: false, error: { message: "Service not found" } });
    service.materials.push(req.body);
    await service.save();
    res.json({ success: true, data: { materials: service.materials } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

exports.updateMaterial = async (req, res) => {
  try {
    const service = await Service.findOne({
      _id: req.params.service_id,
      tenant_id: req.tenantId,
    });
    if (!service)
      return res
        .status(404)
        .json({ success: false, error: { message: "Service not found" } });
    const mat =
      service.materials.id(req.params.material_id) ||
      service.materials.find((m) => m.material_id === req.params.material_id);
    if (!mat)
      return res
        .status(404)
        .json({ success: false, error: { message: "Material not found" } });
    Object.assign(mat, req.body);
    await service.save();
    res.json({ success: true, data: { material: mat } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

exports.deleteMaterial = async (req, res) => {
  try {
    const service = await Service.findOne({
      _id: req.params.service_id,
      tenant_id: req.tenantId,
    });
    if (!service)
      return res
        .status(404)
        .json({ success: false, error: { message: "Service not found" } });
    service.materials = service.materials.filter(
      (m) => m.material_id !== req.params.material_id
    );
    await service.save();
    res.json({ success: true, message: "Material removed" });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

exports.getServiceStats = async (req, res) => {
  res.json({ success: true, data: { stats: {} } });
};
