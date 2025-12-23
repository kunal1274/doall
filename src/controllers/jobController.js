const Job = require("../models/Job");
const User = require("../models/User");
const Tenant = require("../models/Tenant");

// Create job (basic)
exports.createJob = async (req, res) => {
  try {
    const { service_id, address_id, booking_type, preferred_date } = req.body;
    const job = await Job.create({
      tenant_id: req.tenantId,
      service_id,
      customer_id: req.userId,
      schedule: { booking_type, preferred_date },
    });
    res.json({ success: true, data: { job } });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: { code: "CREATE_JOB_FAILED", message: error.message },
      });
  }
};

exports.getJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ tenant_id: req.tenantId }).limit(50);
    res.json({ success: true, data: { jobs } });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.job_id,
      tenant_id: req.tenantId,
    });
    if (!job)
      return res
        .status(404)
        .json({
          success: false,
          error: { code: "JOB_NOT_FOUND", message: "Job not found" },
        });
    res.json({ success: true, data: { job } });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

// Assign job (Dispatcher/Admin)
exports.assignJob = async (req, res) => {
  try {
    const { provider_id } = req.body;

    const job = await Job.findOne({
      _id: req.params.job_id,
      tenant_id: req.tenantId,
      status: "pending",
    });
    if (!job)
      return res
        .status(404)
        .json({
          success: false,
          error: {
            code: "JOB_NOT_FOUND",
            message: "Job not found or already assigned",
          },
        });

    const provider = await User.findOne({
      _id: provider_id,
      tenant_id: req.tenantId,
      "roles.role": "provider",
      status: "active",
    });
    if (!provider)
      return res
        .status(404)
        .json({
          success: false,
          error: {
            code: "PROVIDER_NOT_FOUND",
            message: "Provider not found or inactive",
          },
        });

    job.provider_id = provider_id;
    job.dispatcher_id = req.userId;
    job.status = "assigned";
    job.status_history.push({
      status: "assigned",
      timestamp: new Date(),
      updated_by: req.userId,
    });

    await job.save();

    const socketManager = req.app.get("socketManager");
    if (socketManager)
      socketManager.emitToUser(provider_id, "job:assigned", {
        jobId: job._id,
        jobNumber: job.job_number,
      });

    res.json({ success: true, data: { job } });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: { code: "ASSIGN_JOB_FAILED", message: error.message },
      });
  }
};

exports.acceptJob = async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.job_id,
      tenant_id: req.tenantId,
      provider_id: req.userId,
      status: "assigned",
    });
    if (!job)
      return res
        .status(404)
        .json({
          success: false,
          error: {
            code: "JOB_NOT_FOUND",
            message: "Job not found or cannot be accepted",
          },
        });
    job.status = "accepted";
    job.status_history.push({
      status: "accepted",
      timestamp: new Date(),
      updated_by: req.userId,
    });
    await job.save();
    res.json({ success: true, data: { job } });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

// Reject job
exports.rejectJob = async (req, res) => {
  try {
    const { reason } = req.body;

    const job = await Job.findOne({
      _id: req.params.job_id,
      tenant_id: req.tenantId,
      provider_id: req.userId,
      status: "assigned",
    });
    if (!job)
      return res
        .status(404)
        .json({
          success: false,
          error: {
            code: "JOB_NOT_FOUND",
            message: "Job not found or cannot be rejected",
          },
        });

    job.provider_id = null;
    job.status = "pending";
    job.status_history.push({
      status: "rejected",
      timestamp: new Date(),
      updated_by: req.userId,
    });
    job.provider_notes = `Rejected: ${reason}`;

    await job.save();

    res.json({ success: true, data: { job } });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: { code: "REJECT_JOB_FAILED", message: error.message },
      });
  }
};

// Start work
exports.startWork = async (req, res) => {
  try {
    const { latitude, longitude, start_time } = req.body;
    const job = await Job.findOne({
      _id: req.params.job_id,
      tenant_id: req.tenantId,
      provider_id: req.userId,
      status: { $in: ["accepted", "on_the_way"] },
    });
    if (!job)
      return res
        .status(404)
        .json({
          success: false,
          error: {
            code: "JOB_NOT_FOUND",
            message: "Job not found or cannot be started",
          },
        });

    job.status = "in_progress";
    job.schedule.actual_start_time = start_time || new Date();
    job.status_history.push({
      status: "in_progress",
      timestamp: new Date(),
      updated_by: req.userId,
    });

    await job.save();

    const socketManager = req.app.get("socketManager");
    if (socketManager)
      socketManager.emitToJob(job._id, "job:status-changed", {
        jobId: job._id,
        status: "in_progress",
      });

    res.json({ success: true, data: { job } });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: { code: "START_WORK_FAILED", message: error.message },
      });
  }
};

// Complete work
exports.completeWork = async (req, res) => {
  try {
    const { end_time, materials_used, provider_notes, photos_after } = req.body;

    const job = await Job.findOne({
      _id: req.params.job_id,
      tenant_id: req.tenantId,
      provider_id: req.userId,
      status: "in_progress",
    }).populate("service_id");
    if (!job)
      return res
        .status(404)
        .json({
          success: false,
          error: {
            code: "JOB_NOT_FOUND",
            message: "Job not found or not in progress",
          },
        });

    const tenant = await Tenant.findById(req.tenantId);

    const commissionService = require("../services/commissionService");
    const pricing = await commissionService.calculateJobPricing(
      job,
      tenant,
      materials_used || [],
      end_time || new Date()
    );

    job.status = "completed";
    job.schedule.actual_end_time = end_time || new Date();
    job.schedule.duration_minutes = Math.round(
      (new Date(job.schedule.actual_end_time) -
        new Date(job.schedule.actual_start_time)) /
        60000
    );
    job.pricing = pricing;
    job.provider_notes = provider_notes;
    if (photos_after) job.photos.after = photos_after;
    job.status_history.push({
      status: "completed",
      timestamp: new Date(),
      updated_by: req.userId,
    });

    await job.save();

    const invoiceService = require("../services/invoiceService");
    const invoiceUrl = await invoiceService.generateInvoice(job);

    job.invoice = {
      invoice_number: `INV-${new Date().getFullYear()}-${String(job._id)
        .slice(-6)
        .toUpperCase()}`,
      invoice_url: invoiceUrl,
      generated_at: new Date(),
    };
    await job.save();

    const socketManager = req.app.get("socketManager");
    if (socketManager)
      socketManager.emitToJob(job._id, "job:completed", {
        jobId: job._id,
        totalAmount: job.pricing.total_amount,
      });

    res.json({ success: true, data: { job } });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: { code: "COMPLETE_WORK_FAILED", message: error.message },
      });
  }
};

// Cancel job
exports.cancelJob = async (req, res) => {
  try {
    const { reason } = req.body;
    const job = await Job.findOne({
      _id: req.params.job_id,
      tenant_id: req.tenantId,
      status: { $nin: ["completed", "cancelled"] },
    });
    if (!job)
      return res
        .status(404)
        .json({
          success: false,
          error: {
            code: "JOB_NOT_FOUND",
            message: "Job not found or cannot be cancelled",
          },
        });

    const canCancel =
      job.customer_id.toString() === req.userId.toString() ||
      job.provider_id?.toString() === req.userId.toString() ||
      req.user.hasRole("admin");
    if (!canCancel)
      return res
        .status(403)
        .json({
          success: false,
          error: { code: "FORBIDDEN", message: "Cannot cancel this job" },
        });

    job.status = "cancelled";
    job.cancellation = {
      cancelled: true,
      cancelled_by: req.userId,
      cancelled_at: new Date(),
      cancellation_reason: reason,
    };
    job.status_history.push({
      status: "cancelled",
      timestamp: new Date(),
      updated_by: req.userId,
    });

    await job.save();

    res.json({ success: true, data: { job } });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: { code: "CANCEL_JOB_FAILED", message: error.message },
      });
  }
};

// Rate job
exports.rateJob = async (req, res) => {
  try {
    const {
      overall_rating,
      punctuality_rating,
      quality_rating,
      behavior_rating,
      review,
    } = req.body;
    const job = await Job.findOne({
      _id: req.params.job_id,
      tenant_id: req.tenantId,
      customer_id: req.userId,
      status: "completed",
    });
    if (!job)
      return res
        .status(404)
        .json({
          success: false,
          error: {
            code: "JOB_NOT_FOUND",
            message: "Job not found or not completed",
          },
        });
    if (job.rating?.rated_at)
      return res
        .status(400)
        .json({
          success: false,
          error: { code: "ALREADY_RATED", message: "Job already rated" },
        });

    job.rating = {
      overall_rating,
      punctuality_rating: punctuality_rating || overall_rating,
      quality_rating: quality_rating || overall_rating,
      behavior_rating: behavior_rating || overall_rating,
      review,
      rated_at: new Date(),
    };
    await job.save();

    if (job.provider_id) {
      const providerJobs = await Job.find({
        provider_id: job.provider_id,
        "rating.overall_rating": { $exists: true },
      });
      const avgRating =
        providerJobs.reduce((sum, j) => sum + j.rating.overall_rating, 0) /
        providerJobs.length;
      await User.findByIdAndUpdate(job.provider_id, {
        "stats.average_rating": Math.round(avgRating * 10) / 10,
      });
    }

    res.json({ success: true, data: { rating: job.rating } });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: { code: "RATE_JOB_FAILED", message: error.message },
      });
  }
};
