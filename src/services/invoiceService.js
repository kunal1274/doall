// ==========================================
// src/services/invoiceService.js
// GST-Compliant PDF Invoice Generator
// ==========================================

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const Tenant = require('../models/Tenant');
const User = require('../models/User');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

class InvoiceService {
  /**
   * Generate GST-compliant invoice PDF
   * @param {Object} job - Job document with pricing details
   * @returns {Promise<string>} - URL of uploaded invoice
   */
  async generateInvoice(job) {
    try {
      // Fetch related data
      const [tenant, customer, provider] = await Promise.all([
        Tenant.findById(job.tenant_id),
        User.findById(job.customer_id),
        User.findById(job.provider_id)
      ]);

      // Generate invoice number if not exists
      const invoiceNumber = job.invoice?.invoice_number || 
        `INV-${new Date().getFullYear()}-${String(job._id).slice(-6).toUpperCase()}`;

      // Create PDF
      const doc = new PDFDocument({ 
        size: 'A4',
        margin: 50,
        bufferPages: true
      });

      // Create temporary file
      const tempDir = path.join(__dirname, '../../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const filename = `invoice-${invoiceNumber}.pdf`;
      const filepath = path.join(tempDir, filename);
      const writeStream = fs.createWriteStream(filepath);

      doc.pipe(writeStream);

      // Build invoice content
      this.addHeader(doc, tenant, invoiceNumber);
      this.addBillingInfo(doc, tenant, customer, provider);
      this.addJobDetails(doc, job);
      this.addPricingTable(doc, job);
      this.addPaymentInfo(doc, job);
      this.addFooter(doc);

      // Finalize PDF
      doc.end();

      // Wait for file to be written
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      // Upload to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(filepath, {
        folder: 'invoices',
        public_id: invoiceNumber,
        resource_type: 'raw',
        format: 'pdf'
      });

      // Delete temp file
      fs.unlinkSync(filepath);

      return uploadResult.secure_url;
    } catch (error) {
      console.error('Invoice generation failed:', error);
      throw new Error(`Failed to generate invoice: ${error.message}`);
    }
  }

  /**
   * Add invoice header with company logo and details
   */
  addHeader(doc, tenant, invoiceNumber) {
    // Header background
    doc.rect(0, 0, doc.page.width, 120).fill('#2563eb');

    // Company name
    doc.fillColor('#ffffff')
       .fontSize(24)
       .font('Helvetica-Bold')
       .text(tenant.name, 50, 40);

    // Invoice title
    doc.fontSize(12)
       .font('Helvetica')
       .text('TAX INVOICE', 400, 40);

    // Invoice number and date
    doc.fontSize(10)
       .text(`Invoice No: ${invoiceNumber}`, 400, 60)
       .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 400, 75)
       .text(`Due Date: ${new Date().toLocaleDateString('en-IN')}`, 400, 90);

    // Reset position
    doc.fillColor('#000000').moveDown(4);
  }

  /**
   * Add billing information (from and to)
   */
  addBillingInfo(doc, tenant, customer, provider) {
    const startY = 140;

    // Company details (From)
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .text('From:', 50, startY);

    doc.fontSize(9)
       .font('Helvetica')
       .text(tenant.name, 50, startY + 20)
       .text(tenant.business.address.line1, 50, startY + 35)
       .text(`${tenant.business.address.city}, ${tenant.business.address.state} ${tenant.business.address.pincode}`, 50, startY + 50)
       .text(`GSTIN: ${tenant.business.gstin || 'N/A'}`, 50, startY + 65)
       .text(`PAN: ${tenant.business.pan || 'N/A'}`, 50, startY + 80)
       .text(`Phone: ${tenant.business.contact.phone}`, 50, startY + 95)
       .text(`Email: ${tenant.business.contact.email}`, 50, startY + 110);

    // Customer details (Bill To)
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .text('Bill To:', 320, startY);

    doc.fontSize(9)
       .font('Helvetica')
       .text(`${customer.profile.first_name} ${customer.profile.last_name}`, 320, startY + 20)
       .text(`Phone: ${customer.profile.phone}`, 320, startY + 35)
       .text(`Email: ${customer.profile.email || 'N/A'}`, 320, startY + 50);

    // Service Provider details (if different)
    if (provider) {
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text('Service By:', 320, startY + 80);

      doc.fontSize(9)
         .font('Helvetica')
         .text(`${provider.profile.first_name} ${provider.profile.last_name}`, 320, startY + 100)
         .text(`Phone: ${provider.profile.phone}`, 320, startY + 115);
    }

    doc.moveDown(8);
  }

  /**
   * Add job details section
   */
  addJobDetails(doc, job) {
    const startY = doc.y;

    // Job details header
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .text('Job Details:', 50, startY);

    doc.fontSize(9)
       .font('Helvetica')
       .text(`Job Number: ${job.job_number}`, 50, startY + 20)
       .text(`Service: ${job.service_name}`, 50, startY + 35)
       .text(`Date: ${new Date(job.schedule.actual_start_time).toLocaleDateString('en-IN')}`, 50, startY + 50)
       .text(`Location: ${job.location.address.line1}, ${job.location.address.city}`, 50, startY + 65);

    if (job.schedule.actual_start_time && job.schedule.actual_end_time) {
      const duration = Math.round(job.schedule.duration_minutes / 60 * 10) / 10;
      doc.text(`Duration: ${duration} hours`, 50, startY + 80);
    }

    doc.moveDown(3);
  }

  /**
   * Add pricing table with GST breakdown
   */
  addPricingTable(doc, job) {
    const tableTop = doc.y + 20;
    const pricing = job.pricing;

    // Table headers
    doc.fontSize(10)
       .font('Helvetica-Bold');

    this.generateTableRow(
      doc,
      tableTop,
      'Description',
      'HSN/SAC',
      'Qty',
      'Rate',
      'Amount'
    );

    // Draw line under header
    doc.moveTo(50, tableTop + 20)
       .lineTo(550, tableTop + 20)
       .stroke();

    doc.font('Helvetica').fontSize(9);

    let position = tableTop + 30;

    // Labor charges
    this.generateTableRow(
      doc,
      position,
      'Labor Charges',
      '998514', // SAC code for repair services
      pricing.hours_worked ? `${pricing.hours_worked} hrs` : '1',
      this.formatCurrency(pricing.hourly_rate || pricing.base_charge),
      this.formatCurrency(pricing.labor_cost)
    );
    position += 20;

    // Materials
    if (pricing.materials && pricing.materials.length > 0) {
      pricing.materials.forEach(material => {
        this.generateTableRow(
          doc,
          position,
          material.name,
          '39173900', // HSN for plumbing materials
          material.quantity,
          this.formatCurrency(material.unit_price),
          this.formatCurrency(material.total)
        );
        position += 20;
      });
    }

    // Additional charges
    if (pricing.emergency_surcharge > 0) {
      this.generateTableRow(
        doc,
        position,
        'Emergency Surcharge',
        '998514',
        '1',
        this.formatCurrency(pricing.emergency_surcharge),
        this.formatCurrency(pricing.emergency_surcharge)
      );
      position += 20;
    }

    if (pricing.peak_hour_surcharge > 0) {
      this.generateTableRow(
        doc,
        position,
        'Peak Hour Surcharge',
        '998514',
        '1',
        this.formatCurrency(pricing.peak_hour_surcharge),
        this.formatCurrency(pricing.peak_hour_surcharge)
      );
      position += 20;
    }

    if (pricing.distance_charge > 0) {
      this.generateTableRow(
        doc,
        position,
        'Distance Charge',
        '998514',
        '1',
        this.formatCurrency(pricing.distance_charge),
        this.formatCurrency(pricing.distance_charge)
      );
      position += 20;
    }

    // Adjustments (discounts, waivers, fees)
    if (pricing.adjustments && pricing.adjustments.length > 0) {
      pricing.adjustments.forEach(adj => {
        const amount = adj.type === 'discount' || adj.type === 'waiver' ? 
          -Math.abs(adj.amount) : adj.amount;
        
        this.generateTableRow(
          doc,
          position,
          adj.description,
          '998514',
          '1',
          this.formatCurrency(amount),
          this.formatCurrency(amount)
        );
        position += 20;
      });
    }

    // Draw line before totals
    doc.moveTo(50, position)
       .lineTo(550, position)
       .stroke();

    position += 10;

    // Subtotal
    doc.font('Helvetica-Bold');
    this.generateTableRow(
      doc,
      position,
      '',
      '',
      '',
      'Subtotal:',
      this.formatCurrency(pricing.subtotal)
    );
    position += 20;

    // GST breakdown
    doc.font('Helvetica');
    if (pricing.gst.cgst_amount > 0) {
      this.generateTableRow(
        doc,
        position,
        '',
        '',
        '',
        `CGST (${pricing.gst.cgst_percentage}%):`,
        this.formatCurrency(pricing.gst.cgst_amount)
      );
      position += 20;
    }

    if (pricing.gst.sgst_amount > 0) {
      this.generateTableRow(
        doc,
        position,
        '',
        '',
        '',
        `SGST (${pricing.gst.sgst_percentage}%):`,
        this.formatCurrency(pricing.gst.sgst_amount)
      );
      position += 20;
    }

    if (pricing.gst.igst_amount > 0) {
      this.generateTableRow(
        doc,
        position,
        '',
        '',
        '',
        `IGST (${pricing.gst.igst_percentage}%):`,
        this.formatCurrency(pricing.gst.igst_amount)
      );
      position += 20;
    }

    // Late fine (if applicable)
    if (pricing.late_fine && pricing.late_fine.total_penalty > 0) {
      this.generateTableRow(
        doc,
        position,
        '',
        '',
        '',
        'Late Fine:',
        this.formatCurrency(pricing.late_fine.total_penalty)
      );
      position += 20;
    }

    // Draw line before grand total
    doc.moveTo(50, position)
       .lineTo(550, position)
       .stroke();

    position += 10;

    // Grand Total
    doc.fontSize(12).font('Helvetica-Bold');
    this.generateTableRow(
      doc,
      position,
      '',
      '',
      '',
      'Total Amount:',
      this.formatCurrency(pricing.total_amount)
    );

    // Amount in words
    position += 30;
    doc.fontSize(9).font('Helvetica');
    doc.text(`Amount in words: ${this.numberToWords(pricing.total_amount)} Rupees Only`, 50, position);

    doc.moveDown(2);
  }

  /**
   * Add payment information
   */
  addPaymentInfo(doc, job) {
    const startY = doc.y + 20;

    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('Payment Information:', 50, startY);

    doc.fontSize(9)
       .font('Helvetica')
       .text(`Payment Status: ${job.payment.status.toUpperCase()}`, 50, startY + 20)
       .text(`Payment Method: ${job.payment.method.toUpperCase()}`, 50, startY + 35);

    if (job.payment.razorpay_payment_id) {
      doc.text(`Transaction ID: ${job.payment.razorpay_payment_id}`, 50, startY + 50);
    }

    if (job.payment.paid_at) {
      doc.text(`Paid on: ${new Date(job.payment.paid_at).toLocaleString('en-IN')}`, 50, startY + 65);
    }

    doc.moveDown(2);
  }

  /**
   * Add footer with terms and signature
   */
  addFooter(doc) {
    const pageHeight = doc.page.height;
    const footerTop = pageHeight - 120;

    // Terms and conditions
    doc.fontSize(8)
       .font('Helvetica')
       .text('Terms & Conditions:', 50, footerTop)
       .text('1. Payment is due immediately unless otherwise agreed.', 50, footerTop + 15)
       .text('2. Late payments may incur additional charges.', 50, footerTop + 27)
       .text('3. All disputes subject to local jurisdiction.', 50, footerTop + 39);

    // Signature area
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .text('Authorized Signatory', 400, footerTop + 50);

    // Footer line
    doc.moveTo(50, pageHeight - 40)
       .lineTo(550, pageHeight - 40)
       .stroke();

    doc.fontSize(8)
       .font('Helvetica')
       .text('This is a computer-generated invoice and does not require a physical signature.', 
         50, pageHeight - 30, { align: 'center', width: 500 });
  }

  /**
   * Generate a table row
   */
  generateTableRow(doc, y, col1, col2, col3, col4, col5) {
    doc.text(col1, 50, y, { width: 200 })
       .text(col2, 250, y, { width: 80 })
       .text(col3, 330, y, { width: 60 })
       .text(col4, 390, y, { width: 80, align: 'right' })
       .text(col5, 470, y, { width: 80, align: 'right' });
  }

  /**
   * Format currency
   */
  formatCurrency(amount) {
    return '₹' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  }

  /**
   * Convert number to words (Indian numbering system)
   */
  numberToWords(num) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    const amount = Math.floor(num);
    
    if (amount === 0) return 'Zero';

    let words = '';

    // Crores
    if (amount >= 10000000) {
      words += this.numberToWords(Math.floor(amount / 10000000)) + ' Crore ';
      amount %= 10000000;
    }

    // Lakhs
    if (amount >= 100000) {
      words += this.numberToWords(Math.floor(amount / 100000)) + ' Lakh ';
      amount %= 100000;
    }

    // Thousands
    if (amount >= 1000) {
      words += this.numberToWords(Math.floor(amount / 1000)) + ' Thousand ';
      amount %= 1000;
    }

    // Hundreds
    if (amount >= 100) {
      words += ones[Math.floor(amount / 100)] + ' Hundred ';
      amount %= 100;
    }

    // Tens and ones
    if (amount >= 20) {
      words += tens[Math.floor(amount / 10)] + ' ';
      amount %= 10;
    } else if (amount >= 10) {
      words += teens[amount - 10] + ' ';
      return words.trim();
    }

    if (amount > 0) {
      words += ones[amount] + ' ';
    }

    return words.trim();
  }

  /**
   * Send invoice via multiple channels
   */
  async sendInvoice(job, channels) {
    const promises = [];

    if (channels.includes('email')) {
      promises.push(this.sendViaEmail(job));
    }

    if (channels.includes('whatsapp')) {
      promises.push(this.sendViaWhatsApp(job));
    }

    if (channels.includes('sms')) {
      promises.push(this.sendViaSMS(job));
    }

    await Promise.all(promises);
  }

  /**
   * Send invoice via email
   */
  async sendViaEmail(job) {
    const emailService = require('./emailService');
    const customer = await User.findById(job.customer_id);

    if (customer.profile.email) {
      await emailService.sendEmail({
        to: customer.profile.email,
        subject: `Invoice ${job.invoice.invoice_number} - ${job.service_name}`,
        template: 'invoice',
        context: {
          customer_name: `${customer.profile.first_name} ${customer.profile.last_name}`,
          invoice_number: job.invoice.invoice_number,
          invoice_url: job.invoice.invoice_url,
          total_amount: this.formatCurrency(job.pricing.total_amount)
        },
        attachments: [
          {
            filename: `${job.invoice.invoice_number}.pdf`,
            path: job.invoice.invoice_url
          }
        ]
      });
    }
  }

  /**
   * Send invoice via WhatsApp
   */
  async sendViaWhatsApp(job) {
    const whatsappService = require('./whatsappService');
    const customer = await User.findById(job.customer_id);

    await whatsappService.sendMessage({
      to: customer.profile.phone,
      message: `Hi ${customer.profile.first_name}! Your invoice ${job.invoice.invoice_number} for ${job.service_name} is ready. Total amount: ${this.formatCurrency(job.pricing.total_amount)}. Download: ${job.invoice.invoice_url}`
    });
  }

  /**
   * Send invoice via SMS
   */
  async sendViaSMS(job) {
    const smsService = require('./smsService');
    const customer = await User.findById(job.customer_id);

    await smsService.sendSMS({
      to: customer.profile.phone,
      message: `Invoice ${job.invoice.invoice_number} generated. Amount: ${this.formatCurrency(job.pricing.total_amount)}. Download: ${job.invoice.invoice_url}`
    });
  }
}

module.exports = new InvoiceService();
