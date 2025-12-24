const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

async function resetPasswords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const User = require("../src/models/User");

    // Find admin user
    const admin = await User.findOne({ "profile.email": "admin@doall.com" });
    if (admin) {
      // Directly update the password_hash to bypass the pre-save hook
      const hashedPassword = await bcrypt.hash("Admin@123", 10);
      await User.updateOne(
        { _id: admin._id },
        { $set: { "auth.password_hash": hashedPassword } }
      );
      console.log("✓ Admin password reset");
    }

    // Find customer user
    const customer = await User.findOne({
      "profile.email": "customer@test.com",
    });
    if (customer) {
      const hashedPassword = await bcrypt.hash("Customer@123", 10);
      await User.updateOne(
        { _id: customer._id },
        { $set: { "auth.password_hash": hashedPassword } }
      );
      console.log("✓ Customer password reset");
    }

    console.log("\n✅ Passwords reset successfully!");
    console.log("\nTest credentials:");
    console.log("Admin: admin@doall.com / Admin@123");
    console.log("Customer: customer@test.com / Customer@123");
    console.log("\nDon't forget to include tenant ID header:");
    console.log("x-tenant-id: 694b427e576268245d7faf75");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.connection.close();
  }
}

resetPasswords();
