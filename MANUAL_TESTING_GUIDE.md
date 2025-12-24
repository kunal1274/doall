# 🧪 STEP-BY-STEP TESTING GUIDE - HANDS ON

**Date:** December 24, 2024  
**Duration:** 2-3 hours  
**Goal:** Test all critical features systematically

---

## 📋 PRE-TESTING CHECKLIST

### ✅ Step 0: Verify Setup (5 minutes)

Run these commands one by one:

```bash
# 1. Navigate to project
cd /Users/ratxensolutionspvtltd/Desktop/4_LiveClients/doall.worktrees/worktree-2025-12-24T04-25-51

# 2. Check MongoDB is running
docker ps | grep mongo

# Expected: Should see MongoDB container running
# If not running: docker-compose up -d mongodb

# 3. Check Redis is running
docker ps | grep redis

# Expected: Should see Redis container
# If not running: docker-compose up -d redis

# 4. Check logs directory exists
ls -la logs/

# Expected: Should see error.log and combined.log (or empty directory)

# 5. Verify environment variables
cat .env | grep JWT_SECRET

# Expected: Should see your JWT_SECRET (not the old one)
```

**✅ CHECKPOINT:** All services running? Logs directory exists? → Continue

**❌ IF ANY FAIL:**

- MongoDB not running? Run: `docker-compose up -d mongodb`
- Redis not running? Run: `docker-compose up -d redis`
- Logs missing? Run: `mkdir -p logs`

---

## 🚀 PHASE 1: START THE SERVER (10 minutes)

### Step 1.1: Start Server

```bash
# Start the server
npm start
```

**Watch for these messages:**

```
✓ MongoDB connected
✓ Redis connected
✓ Server listening on port 11000
✓ Socket.IO initialized
```

**✅ PASS IF:** Server starts without errors, all services connected

**❌ FAIL IF:**

- "Cannot find module 'logger'" → Logger file missing
- "JWT_SECRET undefined" → Update .env file
- "MongoDB connection failed" → Check MongoDB running
- "EADDRINUSE" → Port 11000 already in use

**Fix Common Errors:**

```bash
# If logger missing
ls -la src/config/logger.js

# If JWT_SECRET missing
echo "Check your .env file has JWT_SECRET and JWT_REFRESH_SECRET"

# If port in use
lsof -ti:11000 | xargs kill -9
```

**Keep server running in this terminal. Open a NEW terminal for testing.**

---

## 🏥 PHASE 2: TEST HEALTH ENDPOINTS (5 minutes)

### Step 2.1: Test Basic Health Check

Open a **NEW terminal**, then run:

```bash
curl http://localhost:11000/health
```

**Expected Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-12-24T07:43:19.128Z",
  "uptime": 5.234,
  "environment": "development",
  "mongodb": "connected",
  "version": "1.0.0"
}
```

**✅ PASS IF:**

- Status code: 200
- mongodb: "connected"
- All fields present

**❌ FAIL IF:**

- mongodb: "disconnected" → Check MongoDB
- 500 error → Check server logs
- No response → Check server is running

---

### Step 2.2: Test Readiness Check

```bash
curl http://localhost:11000/health/ready
```

**Expected Response:**

```json
{
  "status": "ok",
  "checks": {
    "mongodb": true,
    "uptime": true
  },
  "ready": true
}
```

**✅ PASS IF:** ready: true, all checks: true

**Take Screenshot:** Save this response - proves health checks working

---

## 🔐 PHASE 3: TEST AUTHENTICATION (15 minutes)

### Step 3.1: Register New User

```bash
curl -X POST http://localhost:11000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: test-tenant-001" \
  -d '{
    "phone": "+919876543210",
    "email": "testuser@example.com",
    "first_name": "Test",
    "last_name": "User",
    "password": "Test@123456",
    "role": "customer"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "...",
    "user": {
      "id": "...",
      "phone": "+919876543210",
      "email": "testuser@example.com",
      "role": "customer"
    }
  }
}
```

**✅ PASS IF:**

- Status: 200 or 201
- Token received
- User object returned
- Password NOT in response

**❌ FAIL IF:**

- "Validation failed" → Check if you sent all required fields
- "User already exists" → User with this phone/email exists (try different phone)
- 500 error → Check server logs

**IMPORTANT:** Save the token from response!

```bash
# Copy token and save it
export TOKEN="your_token_here"

# Example:
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### Step 3.2: Test Login

```bash
curl -X POST http://localhost:11000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: test-tenant-001" \
  -d '{
    "phone": "+919876543210",
    "password": "Test@123456"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "token": "...",
    "refreshToken": "...",
    "user": { ... }
  }
}
```

**✅ PASS IF:** Login successful, token received

**❌ FAIL IF:**

- "Invalid credentials" → Check password matches
- "User not found" → Registration didn't work

---

### Step 3.3: Test Invalid Login

```bash
curl -X POST http://localhost:11000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: test-tenant-001" \
  -d '{
    "phone": "+919876543210",
    "password": "WrongPassword"
  }'
```

**Expected Response:**

```json
{
  "success": false,
  "error": {
    "message": "Invalid credentials"
  }
}
```

**✅ PASS IF:** Error message received, status 401

---

## 📍 PHASE 4: TEST GEO-LOCATION (20 minutes)

### Step 4.1: Create Admin User (for service area creation)

```bash
curl -X POST http://localhost:11000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: test-tenant-001" \
  -d '{
    "phone": "+919876543211",
    "email": "admin@doall.com",
    "first_name": "Admin",
    "last_name": "User",
    "password": "Admin@123456",
    "role": "admin"
  }'
```

**Save admin token:**

```bash
export ADMIN_TOKEN="admin_token_from_response"
```

---

### Step 4.2: Create Service Area (Bangalore)

```bash
curl -X POST http://localhost:11000/api/v1/geo/service-areas \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: test-tenant-001" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Bangalore Central",
    "city": "Bangalore",
    "zone_code": "BLR-001",
    "area_type": "radius",
    "boundaries": {
      "radius": {
        "center": {
          "type": "Point",
          "coordinates": [77.5946, 12.9716]
        },
        "radius_km": 5
      }
    },
    "pricing": {
      "base_fare": 50,
      "per_km_charge": 15,
      "per_minute_charge": 2,
      "min_fare": 100,
      "night_surcharge_percent": 20,
      "peak_hour_surcharge_percent": 15
    },
    "max_distance_km": 50,
    "active": true
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "service_area": {
      "_id": "...",
      "name": "Bangalore Central",
      "city": "Bangalore",
      "zone_code": "BLR-001",
      ...
    }
  }
}
```

**✅ PASS IF:** Service area created, status 201

**Save service area ID:**

```bash
export SERVICE_AREA_ID="id_from_response"
```

---

### Step 4.3: Check Location Inside Service Area

```bash
curl -X POST http://localhost:11000/api/v1/geo/check-service-area \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: test-tenant-001" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "latitude": 12.9716,
    "longitude": 77.5946
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "in_service_area": true,
    "matched_areas": [ ... ],
    "location": {
      "latitude": 12.9716,
      "longitude": 77.5946
    }
  }
}
```

**✅ PASS IF:** in_service_area: true

---

### Step 4.4: Check Location Outside Service Area

```bash
curl -X POST http://localhost:11000/api/v1/geo/check-service-area \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: test-tenant-001" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "latitude": 13.0827,
    "longitude": 80.2707
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "in_service_area": false,
    "matched_areas": [],
    "location": {
      "latitude": 13.0827,
      "longitude": 80.2707
    }
  }
}
```

**✅ PASS IF:** in_service_area: false (this is Chennai, not Bangalore)

---

### Step 4.5: Calculate Pricing

```bash
curl -X POST http://localhost:11000/api/v1/geo/calculate-pricing \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: test-tenant-001" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "pickup_lat": 12.9716,
    "pickup_lng": 77.5946,
    "drop_lat": 12.9350,
    "drop_lng": 77.6244
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "distance_km": 5.2,
    "estimated_time_minutes": 8,
    "pricing": {
      "base_fare": 50,
      "distance_charge": 78,
      "subtotal": 128,
      "total": 128
    }
  }
}
```

**✅ PASS IF:**

- Distance calculated (~5km)
- Pricing calculated
- All amounts are numbers

---

## 🚗 PHASE 5: TEST DRIVER FEATURES (25 minutes)

### Step 5.1: Register Driver

```bash
curl -X POST http://localhost:11000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: test-tenant-001" \
  -d '{
    "phone": "+919876543212",
    "email": "driver@test.com",
    "first_name": "Test",
    "last_name": "Driver",
    "password": "Driver@123456",
    "role": "provider"
  }'
```

**Save driver token:**

```bash
export DRIVER_TOKEN="driver_token_from_response"
```

---

### Step 5.2: Update Driver Location

```bash
curl -X POST http://localhost:11000/api/v1/tracking/update \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: test-tenant-001" \
  -H "Authorization: Bearer $DRIVER_TOKEN" \
  -d '{
    "job_id": "temp-job-id",
    "latitude": 12.9716,
    "longitude": 77.5946,
    "status": "idle"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "location": { ... }
  }
}
```

**✅ PASS IF:** Location updated successfully

---

### Step 5.3: Test Input Validation (Should FAIL)

```bash
curl -X POST http://localhost:11000/api/v1/tracking/update \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: test-tenant-001" \
  -H "Authorization: Bearer $DRIVER_TOKEN" \
  -d '{
    "job_id": "invalid-id",
    "latitude": 200,
    "longitude": 77.5946
  }'
```

**Expected Response:**

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "errors": [
      {
        "field": "latitude",
        "message": "Latitude must be between -90 and 90"
      }
    ]
  }
}
```

**✅ PASS IF:** Validation error returned with proper message

---

## 📊 PHASE 6: CHECK LOGS (10 minutes)

### Step 6.1: Check Log Files Created

```bash
# Check logs directory
ls -la logs/

# View error log
tail -20 logs/error.log

# View combined log
tail -50 logs/combined.log
```

**✅ PASS IF:**

- Both log files exist
- Logs contain timestamps
- Errors logged to error.log
- All activity in combined.log

---

### Step 6.2: Check Log Content

```bash
# Search for user registration
grep "User.*registered" logs/combined.log

# Search for service area creation
grep "service_area_created" logs/combined.log

# Search for location updates
grep "Location update" logs/combined.log

# Check for any errors
grep "error" logs/error.log
```

**✅ PASS IF:** Logs show your testing activity

---

## 🧪 PHASE 7: RUN UNIT TESTS (15 minutes)

### Step 7.1: Run Existing Tests

```bash
# Run all tests
npm test

# Or run specific test
npm test -- test-verification.js
```

**Expected Output:**

```
PASS  test-verification.js
  ✓ Health check works
  ✓ Authentication works
  ...

Test Suites: 1 passed, 1 total
Tests:       X passed, X total
```

**✅ PASS IF:** All tests pass

---

## 📝 TEST RESULTS TRACKER

Create a file to track your results:

```bash
cat > TEST_RESULTS.txt << 'EOF'
# Manual Testing Results - December 24, 2024

## Phase 1: Server Startup
- [ ] MongoDB connected: ___
- [ ] Redis connected: ___
- [ ] Server started: ___
- [ ] Socket.IO initialized: ___

## Phase 2: Health Checks
- [ ] /health endpoint: ___
- [ ] /health/ready endpoint: ___
- [ ] MongoDB status shown: ___

## Phase 3: Authentication
- [ ] User registration: ___
- [ ] User login: ___
- [ ] Invalid login rejected: ___
- [ ] Token received: ___

## Phase 4: Geo-Location
- [ ] Service area created: ___
- [ ] Location check (inside): ___
- [ ] Location check (outside): ___
- [ ] Pricing calculation: ___

## Phase 5: Driver Features
- [ ] Driver registration: ___
- [ ] Location update: ___
- [ ] Validation working: ___

## Phase 6: Logs
- [ ] Log files created: ___
- [ ] Errors logged: ___
- [ ] Activity logged: ___

## Phase 7: Unit Tests
- [ ] Tests run: ___
- [ ] Tests passed: ___

## Issues Found:
1. _________________________
2. _________________________
3. _________________________

## Overall Status: PASS / FAIL / PARTIAL
EOF

# Edit this file as you test
nano TEST_RESULTS.txt
```

---

## ✅ SUCCESS CRITERIA

Your testing is **SUCCESSFUL** if:

1. ✅ Server starts without errors
2. ✅ Health checks return 200
3. ✅ User can register and login
4. ✅ Service areas can be created
5. ✅ Location checks work correctly
6. ✅ Pricing calculation works
7. ✅ Driver location updates work
8. ✅ Validation rejects invalid data
9. ✅ Log files contain activity
10. ✅ No critical errors in logs

**If 8/10 pass → Good to continue!**

---

## 🐛 TROUBLESHOOTING

### Server Won't Start

```bash
# Check if port is in use
lsof -ti:11000 | xargs kill -9

# Check MongoDB
docker-compose up -d mongodb

# Check .env file
cat .env | grep JWT_SECRET
```

### Can't Register User

```bash
# Check if MongoDB is working
mongo mongodb://admin:admin123@localhost:11300/service_platform?authSource=admin

# Check tenant ID
# Must include: -H "x-tenant-id: test-tenant-001"
```

### Validation Not Working

```bash
# Check if express-validator installed
npm list express-validator

# If not: npm install express-validator
```

---

## 📞 NEED HELP?

If any test fails:

1. Check server logs in the terminal
2. Check error.log file
3. Verify all services running (MongoDB, Redis)
4. Make sure you're using correct tokens
5. Verify tenant-id header in requests

---

## 🎯 NEXT STEPS AFTER TESTING

Once testing is complete:

1. ✅ **Document Issues** - Add to TEST_RESULTS.txt
2. ✅ **Fix Critical Bugs** - If any found
3. ✅ **Add More Tests** - Expand coverage
4. ✅ **Performance Testing** - Load testing
5. ✅ **Deploy to Staging** - When ready

---

**Testing Time:** 2-3 hours  
**Status:** Ready to start ✅  
**Go at your own pace - no rush!** 🐢

**Happy Testing!** 🧪
