// Quick verification script
const fs = require('fs');
const path = require('path');

console.log('🔍 Running Backend Verification Tests...\n');

const checks = {
  'Dependencies Check': () => {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const required = ['express', 'mongoose', 'pdfkit', 'cloudinary', 'firebase-admin', 'twilio', 'nodemailer', 'handlebars'];
    const missing = required.filter(dep => !pkg.dependencies[dep]);
    return missing.length === 0 ? '✅ All dependencies present' : `❌ Missing: ${missing.join(', ')}`;
  },
  
  'Routes Check': () => {
    const routesDir = 'src/routes';
    const requiredRoutes = ['auth.routes.js', 'user.routes.js', 'service.routes.js', 'job.routes.js', 
                          'payment.routes.js', 'pricing.routes.js', 'promoCode.routes.js', 'admin.routes.js',
                          'tracking.routes.js', 'chat.routes.js', 'notification.routes.js', 'invoice.routes.js'];
    const existing = fs.readdirSync(routesDir);
    const missing = requiredRoutes.filter(r => !existing.includes(r));
    return missing.length === 0 ? '✅ All routes present' : `❌ Missing: ${missing.join(', ')}`;
  },
  
  'Controllers Check': () => {
    const controllersDir = 'src/controllers';
    const requiredControllers = ['authController.js', 'userController.js', 'serviceController.js', 'jobController.js',
                                 'paymentController.js', 'pricingController.js', 'promoCodeController.js', 'adminController.js',
                                 'trackingController.js', 'chatController.js', 'notificationController.js', 'invoiceController.js'];
    const existing = fs.readdirSync(controllersDir);
    const missing = requiredControllers.filter(c => !existing.includes(c));
    return missing.length === 0 ? '✅ All controllers present' : `❌ Missing: ${missing.join(', ')}`;
  },
  
  'Models Check': () => {
    const modelsDir = 'src/models';
    const requiredModels = ['User.js', 'Tenant.js', 'Service.js', 'Job.js', 'ChatMessage.js',
                            'LocationTracking.js', 'Notification.js', 'PromoCode.js'];
    const existing = fs.readdirSync(modelsDir);
    const missing = requiredModels.filter(m => !existing.includes(m));
    return missing.length === 0 ? '✅ All models present' : `❌ Missing: ${missing.join(', ')}`;
  },
  
  'Services Check': () => {
    const servicesDir = 'src/services';
    const requiredServices = ['commissionService.js', 'invoiceService.js'];
    const existing = fs.readdirSync(servicesDir);
    const missing = requiredServices.filter(s => !existing.includes(s));
    return missing.length === 0 ? '✅ All services present' : `❌ Missing: ${missing.join(', ')}`;
  },
  
  'Server.js Check': () => {
    const serverContent = fs.readFileSync('server.js', 'utf8');
    const requiredRoutes = ['/api/v1/auth', '/api/v1/users', '/api/v1/services', '/api/v1/jobs',
                          '/api/v1/payments', '/api/v1/pricing', '/api/v1/promo-codes', '/api/v1/admin',
                          '/api/v1/tracking', '/api/v1/chat', '/api/v1/notifications', '/api/v1/invoices'];
    const missing = requiredRoutes.filter(r => !serverContent.includes(r));
    return missing.length === 0 ? '✅ All routes registered in server.js' : `❌ Missing: ${missing.join(', ')}`;
  },
  
  'Syntax Check': () => {
    try {
      require('./server.js');
      return '✅ Server.js syntax valid';
    } catch (e) {
      return `❌ Syntax error: ${e.message}`;
    }
  }
};

let passed = 0;
let failed = 0;

Object.entries(checks).forEach(([name, check]) => {
  try {
    const result = check();
    console.log(`${name}: ${result}`);
    if (result.startsWith('✅')) passed++;
    else failed++;
  } catch (e) {
    console.log(`${name}: ❌ Error - ${e.message}`);
    failed++;
  }
});

console.log(`\n📊 Summary: ${passed} passed, ${failed} failed`);
console.log(failed === 0 ? '\n✅ ALL CHECKS PASSED - Backend is ready!' : '\n⚠️  Some checks failed. Please review.');

