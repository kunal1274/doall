# Doall — Repository

This repository now includes a complete MongoDB schema reference and a migration script to create the recommended indexes.

- db/schemas/\*.json — example documents for each collection (tenants, users, services, jobs, location_tracking, chat_messages, notifications, settlements, audit_logs)
- scripts/migrations/create_indexes.js — Node.js migration script. Usage:

```bash
export MONGODB_URI="mongodb://user:pass@host:port/dbname"
node scripts/migrations/create_indexes.js
```

If you want, I can run the migration locally (if you provide `MONGODB_URI`) or adapt the schemas to Mongoose/TypeScript models.

# doall
