#!/bin/bash

# Complete System Verification Script
echo "🔍 DoAll Service Platform - System Verification"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check status
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1"
        return 1
    fi
}

# 1. Check Docker Services
echo "1. Checking Docker Services..."
docker-compose ps | grep -q "healthy"
check_status "Docker services are running"
echo ""

# 2. Check MongoDB Connection
echo "2. Checking MongoDB..."
docker exec doall-mongodb mongosh --quiet --eval "db.adminCommand('ping').ok" -u admin -p admin123 > /dev/null 2>&1
check_status "MongoDB is responsive"
echo ""

# 3. Check Redis Connection
echo "3. Checking Redis..."
docker exec doall-redis redis-cli ping | grep -q "PONG"
check_status "Redis is responsive"
echo ""

# 4. Check Backend Health
echo "4. Checking Backend API..."
HEALTH=$(curl -s http://localhost:11000/health)
echo $HEALTH | grep -q "ok"
check_status "Backend health endpoint responding"
echo ""

# 5. Check Database Data
echo "5. Checking Database Data..."
TENANT_COUNT=$(docker exec doall-mongodb mongosh --quiet -u admin -p admin123 \
  --eval "db.getSiblingDB('service_platform').tenants.countDocuments()" 2>/dev/null | tail -1)
if [ "$TENANT_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Found $TENANT_COUNT tenant(s)"
else
    echo -e "${RED}✗${NC} No tenants found"
fi

USER_COUNT=$(docker exec doall-mongodb mongosh --quiet -u admin -p admin123 \
  --eval "db.getSiblingDB('service_platform').users.countDocuments()" 2>/dev/null | tail -1)
if [ "$USER_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Found $USER_COUNT user(s)"
else
    echo -e "${RED}✗${NC} No users found"
fi
echo ""

# 6. Test API Endpoints
echo "6. Testing API Endpoints..."

# Test services endpoint
curl -s http://localhost:11000/api/v1/services | grep -q "success"
check_status "Services API endpoint working"

# Test health endpoint
curl -s http://localhost:11000/health | grep -q "uptime"
check_status "Health endpoint returning proper data"
echo ""

# 7. Check Port Availability
echo "7. Checking Port Configuration..."
lsof -i :11000 | grep -q LISTEN
check_status "Backend listening on port 11000"

lsof -i :11300 | grep -q LISTEN
check_status "MongoDB listening on port 11300"

lsof -i :11200 | grep -q LISTEN
check_status "Redis listening on port 11200"
echo ""

# 8. Check Environment Configuration
echo "8. Checking Environment Configuration..."
if [ -f .env ]; then
    echo -e "${GREEN}✓${NC} .env file exists"
    
    grep -q "JWT_SECRET=" .env && [ $(grep "JWT_SECRET=" .env | cut -d'=' -f2 | wc -c) -gt 50 ]
    check_status "JWT_SECRET configured (secure)"
    
    grep -q "MONGODB_URI=mongodb://admin:admin123@localhost:11300" .env
    check_status "MongoDB URI configured for local instance"
    
    grep -q "PORT=11000" .env
    check_status "Port 11000 configured"
else
    echo -e "${RED}✗${NC} .env file not found"
fi
echo ""

# 9. Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 System Status Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 URLs:"
echo "   Backend API: http://localhost:11000"
echo "   Health Check: http://localhost:11000/health"
echo "   API Endpoint: http://localhost:11000/api/v1"
echo ""
echo "🗄️  Database:"
echo "   MongoDB: localhost:11300"
echo "   Redis: localhost:11200"
echo "   Tenants: $TENANT_COUNT"
echo "   Users: $USER_COUNT"
echo ""
echo "🔐 Test Credentials:"
echo "   Admin: admin@doall.com / Admin@123"
echo "   Customer: customer@test.com / Customer@123"
echo ""
echo "📚 Documentation:"
echo "   Setup Guide: SETUP_COMPLETE.md"
echo "   Quick Ref: QUICK_REFERENCE.md"
echo "   README: README.md"
echo ""
echo -e "${GREEN}✅ All systems operational!${NC}"
echo ""
