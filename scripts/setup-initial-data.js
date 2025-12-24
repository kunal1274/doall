const mongoose = require("mongoose");
require("dotenv").config();

const Tenant = require("../src/models/Tenant");
const User = require("../src/models/User");
const bcrypt = require("bcryptjs");

async function createInitialData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Check if tenant already exists
    let tenant = await Tenant.findOne({ slug: "doall" });

    if (!tenant) {
      // Create default tenant
      tenant = await Tenant.create({
        name: "DoAll Services",
        slug: "doall",
        domain: "doall.com",
        business: {
          gstin: "TEMP000000000",
          pan: "TEMPAN0000",
          address: {
            line1: "Main Office",
            city: "Mumbai",
            state: "Maharashtra",
            pincode: "400001",
            country: "India",
          },
          contact: {
            phone: "+911234567890",
            email: "admin@doall.com",
            website: "https://doall.com",
          },
        },
        commission_config: {
          platform_fee: 1.0,
          dispatcher_cut: 2.0,
          admin_cut: 18.0,
          provider_cut: 79.0,
        },
        status: "active",
      });
      console.log("✅ Created default tenant:", tenant.name);
    } else {
      console.log("✓ Tenant already exists:", tenant.name);
    }

    // Check if admin user exists
    let adminUser = await User.findOne({ "profile.email": "admin@doall.com" });

    if (!adminUser) {
      // Hash password
      const hashedPassword = await bcrypt.hash("Admin@123", 10);

      // Create admin user
      adminUser = await User.create({
        tenant_id: tenant._id,
        profile: {
          first_name: "Admin",
          last_name: "User",
          email: "admin@doall.com",
          phone: "+919999999999",
        },
        auth: {
          password_hash: hashedPassword,
          is_phone_verified: true,
          is_email_verified: true,
        },
        roles: [
          {
            role: "admin",
            assigned_at: new Date(),
          },
          {
            role: "customer",
            assigned_at: new Date(),
          },
        ],
        availability: {
          current_location: {
            type: "Point",
            coordinates: [0, 0], // Default coordinates
          },
        },
        status: "active",
      });
      console.log("✅ Created admin user");
      console.log("   Email: admin@doall.com");
      console.log("   Password: Admin@123");
      console.log("   Phone: +919999999999");
    } else {
      console.log("✓ Admin user already exists");
    }

    // Create a test customer
    let customer = await User.findOne({ "profile.email": "customer@test.com" });

    if (!customer) {
      const hashedPassword = await bcrypt.hash("Customer@123", 10);

      customer = await User.create({
        tenant_id: tenant._id,
        profile: {
          first_name: "Test",
          last_name: "Customer",
          email: "customer@test.com",
          phone: "+919888888888",
        },
        auth: {
          password_hash: hashedPassword,
          is_phone_verified: true,
          is_email_verified: true,
        },
        roles: [
          {
            role: "customer",
            assigned_at: new Date(),
          },
        ],
        availability: {
          current_location: {
            type: "Point",
            coordinates: [0, 0], // Default coordinates
          },
        },
        status: "active",
      });
      console.log("✅ Created test customer");
      console.log("   Email: customer@test.com");
      console.log("   Password: Customer@123");
      console.log("   Phone: +919888888888");
    } else {
      console.log("✓ Test customer already exists");
    }

    console.log("\n🎉 Initial data setup complete!");
    console.log("\n📋 Summary:");
    console.log(`   Tenant: ${tenant.name} (${tenant.slug})`);
    console.log(`   Tenant ID: ${tenant._id}`);
    console.log(`   Admin User ID: ${adminUser._id}`);
    console.log(`   Customer User ID: ${customer._id}`);
    console.log("\n🔐 Test Login Credentials:");
    console.log("   Admin: admin@doall.com / Admin@123");
    console.log("   Customer: customer@test.com / Customer@123");
    console.log("\n🚀 Server is running on: http://localhost:11000");
    console.log("   Health: http://localhost:11000/health");
    console.log("   API: http://localhost:11000/api/v1");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\n✓ Database connection closed");
  }
}

createInitialData();
