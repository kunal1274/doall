const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("../src/models/User");
const Tenant = require("../src/models/Tenant");

const demoTenant = {
  name: "DoAll Demo",
  slug: "demo",
  domain: "demo.doall.com",
  business: {
    contact: {
      phone: "+919876543200",
      email: "admin@demo.com",
    },
  },
  status: "active",
};

const demoUsers = [
  {
    profile: {
      first_name: "Demo",
      last_name: "Customer",
      phone: "+919876543210",
      email: "customer@demo.com",
      gender: "male",
    },
    roles: [
      {
        role: "customer",
        status: "active",
      },
    ],
    addresses: [
      {
        label: "home",
        line1: "123 Demo Street",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560001",
        location: {
          type: "Point",
          coordinates: [77.5946, 12.9716],
        },
        is_default: true,
      },
    ],
    auth: {
      password_hash: "demo123",
      phone_verified: true,
      email_verified: true,
    },
    availability: {
      is_available: false,
      current_location: {
        type: "Point",
        coordinates: [77.5946, 12.9716],
      },
    },
    status: "active",
  },
  {
    profile: {
      first_name: "Demo",
      last_name: "Provider",
      phone: "+919876543211",
      email: "provider@demo.com",
      gender: "male",
    },
    roles: [
      {
        role: "provider",
        status: "active",
        provider_details: {
          services: ["driver", "car-rental"],
          experience_years: 5,
          certifications: ["Driving License", "First Aid"],
          verification_status: "verified",
          verified_at: new Date(),
        },
      },
    ],
    addresses: [
      {
        label: "home",
        line1: "456 Provider Lane",
        city: "Delhi",
        state: "Delhi",
        pincode: "110001",
        location: {
          type: "Point",
          coordinates: [77.209, 28.6139],
        },
        is_default: true,
      },
    ],
    auth: {
      password_hash: "demo123",
      phone_verified: true,
      email_verified: true,
    },
    availability: {
      is_available: true,
      current_location: {
        type: "Point",
        coordinates: [77.209, 28.6139], // Delhi
      },
    },
    stats: {
      total_jobs: 150,
      completed_jobs: 145,
      average_rating: 4.8,
    },
    status: "active",
  },
  {
    profile: {
      first_name: "Demo",
      last_name: "Admin",
      phone: "+919876543212",
      email: "admin@demo.com",
      gender: "female",
    },
    roles: [
      {
        role: "admin",
        status: "active",
      },
    ],
    addresses: [
      {
        label: "work",
        line1: "789 Admin Avenue",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        location: {
          type: "Point",
          coordinates: [72.8777, 19.076],
        },
        is_default: true,
      },
    ],
    auth: {
      password_hash: "demo123",
      phone_verified: true,
      email_verified: true,
    },
    availability: {
      is_available: false,
      current_location: {
        type: "Point",
        coordinates: [72.8777, 19.076],
      },
    },
    status: "active",
  },
  {
    profile: {
      first_name: "Demo",
      last_name: "Dispatcher",
      phone: "+919876543213",
      email: "dispatcher@demo.com",
      gender: "male",
    },
    roles: [
      {
        role: "dispatcher",
        status: "active",
      },
    ],
    addresses: [
      {
        label: "work",
        line1: "321 Dispatch Road",
        city: "Ranchi",
        state: "Jharkhand",
        pincode: "834001",
        location: {
          type: "Point",
          coordinates: [85.3096, 23.3441],
        },
        is_default: true,
      },
    ],
    auth: {
      password_hash: "demo123",
      phone_verified: true,
      email_verified: true,
    },
    availability: {
      is_available: false,
      current_location: {
        type: "Point",
        coordinates: [85.3096, 23.3441],
      },
    },
    status: "active",
  },
];

async function seedDemoUsers() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:11300/doall"
    );
    console.log("✅ Connected to MongoDB");

    // Create or find demo tenant
    let tenant = await Tenant.findOne({ slug: "demo" });
    if (!tenant) {
      tenant = await Tenant.create(demoTenant);
      console.log("✅ Created demo tenant");
    } else {
      console.log("✅ Found existing demo tenant");
    }

    // Delete existing demo users
    await User.deleteMany({
      "profile.email": { $in: demoUsers.map((u) => u.profile.email) },
    });
    console.log("🗑️  Deleted existing demo users");

    // Create new demo users with hashed passwords
    for (const userData of demoUsers) {
      const hashedPassword = await bcrypt.hash(userData.auth.password_hash, 10);
      const user = await User.create({
        ...userData,
        tenant_id: tenant._id,
        auth: { ...userData.auth, password_hash: hashedPassword },
      });
      console.log(
        `✅ Created demo user: ${userData.profile.email} (${userData.roles[0].role})`
      );
    }

    console.log("\n🎉 Demo users seeded successfully!\n");
    console.log("📝 Demo Credentials:");
    console.log("━".repeat(50));
    demoUsers.forEach((user) => {
      console.log(
        `${user.roles[0].role
          .toUpperCase()
          .padEnd(12)} | ${user.profile.email.padEnd(25)} | demo123`
      );
    });
    console.log("━".repeat(50));

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding demo users:", error);
    process.exit(1);
  }
}

seedDemoUsers();
