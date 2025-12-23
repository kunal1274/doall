/*
Migration script to create the recommended indexes for the platform.
Usage: MONGODB_URI="mongodb://..." node create_indexes.js
*/

const { MongoClient } = require("mongodb");

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Set MONGODB_URI environment variable.");
    process.exit(1);
  }

  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  try {
    await client.connect();
    const db = client.db();

    console.log("Creating indexes...");

    await db.collection("tenants").createIndex({ slug: 1 }, { unique: true });
    await db.collection("tenants").createIndex({ "business.gstin": 1 });
    await db.collection("tenants").createIndex({ status: 1 });

    await db
      .collection("users")
      .createIndex(
        { tenant_id: 1, "profile.phone": 1 },
        { unique: true, sparse: true }
      );
    await db
      .collection("users")
      .createIndex({ tenant_id: 1, "profile.email": 1 });
    await db.collection("users").createIndex({ tenant_id: 1, "roles.role": 1 });
    await db
      .collection("users")
      .createIndex({ "availability.current_location": "2dsphere" });
    await db.collection("users").createIndex({ status: 1 });

    await db
      .collection("services")
      .createIndex({ tenant_id: 1, slug: 1 }, { unique: true });
    await db.collection("services").createIndex({ tenant_id: 1, category: 1 });
    await db.collection("services").createIndex({ status: 1 });

    await db
      .collection("jobs")
      .createIndex({ tenant_id: 1, job_number: 1 }, { unique: true });
    await db
      .collection("jobs")
      .createIndex({ tenant_id: 1, customer_id: 1, created_at: -1 });
    await db
      .collection("jobs")
      .createIndex({ tenant_id: 1, provider_id: 1, created_at: -1 });
    await db.collection("jobs").createIndex({ tenant_id: 1, status: 1 });
    await db
      .collection("jobs")
      .createIndex({ "location.coordinates": "2dsphere" });
    await db.collection("jobs").createIndex({ "schedule.preferred_date": 1 });

    await db
      .collection("location_tracking")
      .createIndex({ job_id: 1, timestamp: -1 });
    await db
      .collection("location_tracking")
      .createIndex({ provider_id: 1, timestamp: -1 });
    await db
      .collection("location_tracking")
      .createIndex({ location: "2dsphere" });
    await db
      .collection("location_tracking")
      .createIndex({ timestamp: 1 }, { expireAfterSeconds: 604800 });

    await db
      .collection("chat_messages")
      .createIndex({ job_id: 1, timestamp: 1 });
    await db
      .collection("chat_messages")
      .createIndex({ sender_id: 1, timestamp: -1 });
    await db
      .collection("chat_messages")
      .createIndex({ recipient_id: 1, read: 1 });

    await db
      .collection("notifications")
      .createIndex({ user_id: 1, created_at: -1 });
    await db.collection("notifications").createIndex({ status: 1 });
    await db
      .collection("notifications")
      .createIndex({ created_at: 1 }, { expireAfterSeconds: 2592000 });

    await db
      .collection("settlements")
      .createIndex({ tenant_id: 1, recipient_id: 1, "period.end_date": -1 });
    await db.collection("settlements").createIndex({ status: 1 });

    await db
      .collection("audit_logs")
      .createIndex({ tenant_id: 1, timestamp: -1 });
    await db
      .collection("audit_logs")
      .createIndex({ actor_id: 1, timestamp: -1 });
    await db
      .collection("audit_logs")
      .createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

    console.log("Indexes created successfully.");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await client.close();
  }
}

main();
