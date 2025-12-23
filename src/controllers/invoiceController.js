const Job = require("../models/Job");
const invoiceService = require("../services/invoiceService");

// @desc    Get invoice
exports.getInvoice = async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.job_id,
      tenant_id: req.tenantId,
      $or: [{ customer_id: req.userId }, { provider_id: req.userId }],
      status: "completed",
    })
      .populate("customer_id", "profile")
      .populate("provider_id", "profile")
      .populate("service_id", "name")
      .lean();
    if (!job)
      return res
        .status(404)
        .json({
          success: false,
          error: { code: "INVOICE_NOT_FOUND", message: "Invoice not found" },
        });

    res.json({
      success: true,
      data: {
        invoice: {
          invoice_number: job.invoice.invoice_number,
          invoice_url: job.invoice.invoice_url,
          job_details: job,
          pricing_breakdown: job.pricing,
        },
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: { code: "GET_INVOICE_FAILED", message: error.message },
      });
  }
};

// @desc    Generate invoice PDF
exports.generateInvoice = async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.job_id,
      tenant_id: req.tenantId,
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

    const invoiceUrl = await invoiceService.generateInvoice(job);

    job.invoice = {
      invoice_number: `INV-${new Date().getFullYear()}-${String(job._id)
        .slice(-6)
        .toUpperCase()}`,
      invoice_url: invoiceUrl,
      generated_at: new Date(),
    };
    await job.save();

    res.json({ success: true, data: { invoice_url: invoiceUrl } });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: { code: "GENERATE_INVOICE_FAILED", message: error.message },
      });
  }
};

// @desc    Send invoice
exports.sendInvoice = async (req, res) => {
  try {
    const { channels } = req.body;
    const job = await Job.findOne({
      _id: req.params.job_id,
      tenant_id: req.tenantId,
    }).populate("customer_id", "profile");
    if (!job || !job.invoice?.invoice_url)
      return res
        .status(404)
        .json({
          success: false,
          error: { code: "INVOICE_NOT_FOUND", message: "Invoice not found" },
        });

    await invoiceService.sendInvoice(job, channels);

    job.invoice.sent_to_customer = true;
    job.invoice.sent_via = channels;
    await job.save();

    res.json({ success: true, message: "Invoice sent successfully" });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: { code: "SEND_INVOICE_FAILED", message: error.message },
      });
  }
};
