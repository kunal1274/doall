# Quick Reference Card

## 🚀 Start/Stop Commands

```bash
# Start all services
docker-compose up -d

# Start backend
npm start

# Start backend in background  
npm start > server.log 2>&1 &

# Stop backend
pkill -f "node server.js"

# Stop Docker services
docker-compose down

# View logs
tail -f server.log
docker-compose logs -f backend
```

## 🔐 Test Credentials

**Admin:**
- Email: admin@doall.com
- Phone: +919999999999
- Password: Admin@123

**Customer:**
- Email: customer@test.com
- Phone: +919888888888
- Password: Customer@123

## 🌐 URLs

- Backend: http://localhost:11000
- Health: http://localhost:11000/health
- API: http://localhost:11000/api/v1
- MongoDB: localhost:11300
- Redis: localhost:11200

## 📡 Quick API Tests

```bash
# Health check
curl http://localhost:11000/health

# Login
curl -X POST http://localhost:11000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919999999999", "password": "Admin@123"}'

# List services
curl http://localhost:11000/api/v1/services

# Register user
curl -X POST http://localhost:11000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543210",
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "password": "Test@123",
    "role": "customer"
  }'
```

## 🗄️ Database Access

```bash
# MongoDB shell
docker exec -it doall-mongodb mongosh -u admin -p admin123

# Redis CLI
docker exec -it doall-redis redis-cli

# View users
docker exec -it doall-mongodb mongosh -u admin -p admin123 \
  --eval "use service_platform; db.users.find().pretty()"

# View tenants
docker exec -it doall-mongodb mongosh -u admin -p admin123 \
  --eval "use service_platform; db.tenants.find().pretty()"
```

## 🔧 Useful Commands

```bash
# Check Docker status
docker-compose ps

# Restart services
docker-compose restart

# Rebuild backend
docker-compose up -d --build backend

# Check port usage
lsof -i :11000

# Kill process on port
lsof -ti:11000 | xargs kill -9

# View running Node processes
ps aux | grep node | grep server.js

# Recreate initial data
node scripts/setup-initial-data.js
```

## 📦 NPM Scripts

```bash
npm start              # Production server
npm run dev            # Development with auto-reload
npm test               # Run tests
npm run docker:up      # Start Docker services
npm run docker:down    # Stop Docker services
npm run docker:logs    # View Docker logs
```

## 🔐 MongoDB Credentials

```
Username: admin
Password: admin123
Database: service_platform
Port: 11300
URI: mongodb://admin:admin123@localhost:11300/service_platform?authSource=admin
```

## 📋 Tenant Info

```
Name: DoAll Services
Slug: doall
Tenant ID: 694b427e576268245d7faf75
Commission: 1% Platform | 2% Dispatcher | 18% Admin | 79% Provider
```

## ⚡ One-Liners

```bash
# Full restart
docker-compose down && docker-compose up -d && npm start > server.log 2>&1 &

# Check everything is running
docker-compose ps && curl -s http://localhost:11000/health | jq .

# View real-time logs
docker-compose logs -f backend mongodb redis

# Reset and recreate data
docker exec -it doall-mongodb mongosh -u admin -p admin123 \
  --eval "use service_platform; db.dropDatabase()" && \
  node scripts/setup-initial-data.js
```

---

For full documentation, see: [SETUP_COMPLETE.md](SETUP_COMPLETE.md)
