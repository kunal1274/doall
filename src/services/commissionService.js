exports.calculateJobPricing = async (job, tenant, materialsUsed, endTime) => {
  // Very simplified pricing: base + materials
  const base = job.pricing?.base_charge || job.pricing?.hourly_rate || 0;
  const materialsTotal = (materialsUsed || []).reduce(
    (s, m) => s + (m.unit_price || 0) * (m.quantity || 0),
    0
  );
  const subtotal = (job.pricing?.subtotal || 0) + materialsTotal;
  const total_gst = subtotal * 0.18;
  const total_amount = subtotal + total_gst;

  // Simplified commission split based on tenant config
  const platform_fee_amount =
    (tenant.commission_config.platform_fee / 100) * subtotal;
  const dispatcher_amount =
    (tenant.commission_config.dispatcher_cut / 100) * subtotal;
  const admin_amount = (tenant.commission_config.admin_cut / 100) * subtotal;
  const provider_gross_amount =
    subtotal - (platform_fee_amount + dispatcher_amount + admin_amount);

  return {
    base_charge: base,
    materials: materialsUsed,
    materials_total: materialsTotal,
    subtotal,
    gst: { total_gst, cgst_amount: total_gst / 2, sgst_amount: total_gst / 2 },
    total_amount,
    commission_split: {
      platform_fee_percentage: tenant.commission_config.platform_fee,
      platform_fee_amount,
      dispatcher_percentage: tenant.commission_config.dispatcher_cut,
      dispatcher_amount: dispatcher_amount,
      admin_percentage: tenant.commission_config.admin_cut,
      admin_amount: admin_amount,
      provider_percentage: tenant.commission_config.provider_cut,
      provider_gross_amount,
      provider_net_amount: provider_gross_amount,
    },
  };
};
