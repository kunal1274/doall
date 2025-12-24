# DoAll Service Platform

A comprehensive multi-tenant service booking and management platform with real-time tracking, driver dispatch, and payment processing.

## 🚀 Quick Start

**Get started in 5 minutes with Docker:**

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Edit .env with your credentials
# 3. Start with Docker
docker-compose up -d

# 4. Check health
curl http://localhost:11000/health
```

See [QUICK_START.md](QUICK_START.md) for detailed instructions.

## 📋 Features

### Core Features

- ✅ Multi-tenant architecture with isolated data
- ✅ User management (Customers, Providers, Dispatchers, Admins)
- ✅ Service booking and job management
- ✅ Real-time location tracking with Socket.io
- ✅ Payment processing (Razorpay integration)
- ✅ Invoice generation with GST calculation
- ✅ Commission management and settlements
- ✅ Promo code system
- ✅ Chat messaging between users
- ✅ Notification system (SMS, Email, Push)
- ✅ PWA support with service workers

### Driver Service Features (Bulaao Integration)

- 🚗 Driver management and dispatch system
- 📍 Real-time GPS tracking and map visualization
- 🚕 Trip session management
- 📱 Customer booking interface
- 💰 Dynamic pricing and fare calculation
- 🎯 Auto-assignment algorithms

See [DRIVER_BULAAO_README.md](DRIVER_BULAAO_README.md) for complete driver service documentation.

## 🏗️ Architecture

### Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis (optional)
- **Real-time**: Socket.io
- **Authentication**: JWT tokens
- **Payments**: Razorpay
- **File Upload**: Cloudinary
- **Containerization**: Docker & Docker Compose

### Port Configuration

| Service     | Port  | URL                       |
| ----------- | ----- | ------------------------- |
| Backend API | 11000 | http://localhost:11000    |
| Frontend    | 11100 | http://localhost:11100    |
| Redis       | 11200 | redis://localhost:11200   |
| MongoDB     | 11300 | mongodb://localhost:11300 |

## 📦 Installation

### Prerequisites

- Node.js 18 or higher
- MongoDB 5.0+ (local or cloud)
- Redis (optional, for caching)
- Docker & Docker Compose (for containerized deployment)

### Option 1: Docker (Recommended)

```bash
# Clone and setup
git clone <repository-url>
cd doall

# Setup environment
cp .env.example .env
# Edit .env with your credentials

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
```

See [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) for complete Docker documentation.

### Option 2: Manual Installation

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database URLs and API keys

# Run database migrations (create indexes)
npm run migrate:indexes

# Start development server
npm run dev

# Or start production server
npm start
```

## 🔧 Configuration

### Environment Variables

Key environment variables in `.env`:

```env
# Application
NODE_ENV=development
PORT=11000

# Database
MONGODB_URI=mongodb://localhost:11300/service_platform
REDIS_URL=redis://localhost:11200

# Authentication
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=24h

# Payment Gateway
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Cloud Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# SMS/Email
TWILIO_ACCOUNT_SID=your_twilio_sid
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com

# Frontend
FRONTEND_URL=http://localhost:11100

# Maps
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

## 🗄️ Database Schema

The platform includes comprehensive MongoDB schemas with proper indexing:

### Collections

- **tenants** - Multi-tenant configuration
- **users** - User accounts (customers, providers, admins)
- **services** - Service catalog with pricing
- **jobs** - Job bookings and tracking
- **drivers** - Driver profiles (Bulaao integration)
- **driver_bookings** - Driver service bookings
- **vehicles** - Vehicle information
- **trip_sessions** - Active trip tracking
- **location_tracking** - GPS location history
- **chat_messages** - In-app messaging
- **notifications** - Notification queue
- **promo_codes** - Discount codes
- **settlements** - Payment settlements
- **audit_logs** - System audit trail

Schema references available in `db/schemas/*.json`

### Database Migrations

```bash
# Create recommended indexes
npm run migrate:indexes
```

## 🔌 API Endpoints

### Authentication

```
POST   /api/v1/auth/register      - Register new user
POST   /api/v1/auth/login         - User login
POST   /api/v1/auth/verify-otp    - Verify OTP
POST   /api/v1/auth/logout        - User logout
```

### Users

```
GET    /api/v1/users/profile      - Get user profile
PUT    /api/v1/users/profile      - Update profile
POST   /api/v1/users/upload       - Upload profile picture
```

### Services

```
GET    /api/v1/services           - List all services
GET    /api/v1/services/:id       - Get service details
POST   /api/v1/services           - Create service (admin)
PUT    /api/v1/services/:id       - Update service (admin)
```

### Jobs

```
GET    /api/v1/jobs               - List user jobs
POST   /api/v1/jobs               - Create new job
GET    /api/v1/jobs/:id           - Get job details
PUT    /api/v1/jobs/:id/accept    - Accept job (provider)
PUT    /api/v1/jobs/:id/complete  - Complete job
```

### Admin

```
GET    /api/v1/admin/dashboard    - Dashboard stats
GET    /api/v1/admin/users        - List all users
PUT    /api/v1/admin/users/:id/verify  - Verify provider
PUT    /api/v1/admin/tenant/commission - Update commission config
```

### Driver Service

```
GET    /api/v1/driver-service/dispatcher/bookings      - List bookings
POST   /api/v1/driver-service/dispatcher/bookings/:id/assign - Assign driver
GET    /api/v1/driver-service/drivers/profile          - Driver profile
POST   /api/v1/driver-service/drivers/trips/start      - Start trip
POST   /api/v1/driver-service/customer/bookings        - Create booking
```

### Payments

```
POST   /api/v1/payments/create-order    - Create payment order
POST   /api/v1/payments/verify          - Verify payment
POST   /api/v1/payments/webhook         - Razorpay webhook
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

```bash
# Login to get token
curl -X POST http://localhost:11000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "password": "password123"}'

# Use token in subsequent requests
curl -X GET http://localhost:11000/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Health check
curl http://localhost:11000/health
```

## 📱 Socket.io Events

### Client → Server

- `join_room` - Join a specific room
- `send_message` - Send chat message
- `location_update` - Update driver location
- `trip_status` - Update trip status

### Server → Client

- `new_message` - New chat message
- `job_update` - Job status changed
- `location_updated` - Driver location updated
- `booking_assigned` - Driver assigned to booking

## 🚀 Deployment

### Docker Production Deployment

```bash
# Build production image
docker build -t doall-backend:latest .

# Run with docker-compose
docker-compose -f docker-compose.yml up -d

# Scale backend
docker-compose up -d --scale backend=3
```

### Environment Setup

1. Set all required environment variables
2. Configure MongoDB Atlas or managed database
3. Setup Redis (optional, but recommended)
4. Configure Razorpay for payments
5. Setup Cloudinary for file uploads
6. Configure Twilio for SMS/WhatsApp
7. Setup SMTP for email notifications

See [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) for complete deployment guide.

## 🛠️ Development

```bash
# Start development server with auto-reload
npm run dev

# Run specific migration
node scripts/migrations/create_indexes.js

# Access MongoDB shell (Docker)
docker exec -it doall-mongodb mongosh -u admin -p admin123

# Access Redis CLI (Docker)
docker exec -it doall-redis redis-cli

# View logs
docker-compose logs -f backend
```

## 📚 Documentation

- [Quick Start Guide](QUICK_START.md) - Get started in 5 minutes
- [Docker Deployment](DOCKER_DEPLOYMENT.md) - Complete Docker guide
- [Driver Service](DRIVER_BULAAO_README.md) - Driver/Bulaao features
- [API Documentation](docs/API.md) - Full API reference (if exists)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 💬 Support

For issues, questions, or support:

- Check existing documentation
- Review logs: `docker-compose logs`
- Verify configuration in `.env`
- Check service health: `curl http://localhost:11000/health`

## 🔄 Migration Scripts

Database migration tools available:

```bash
# Create indexes for all collections
npm run migrate:indexes

# Custom migration
node scripts/migrations/create_indexes.js
```

Schema references in `db/schemas/` directory:

- `tenants.json` - Tenant schema example
- `users.json` - User schema example
- `jobs.json` - Job schema example
- `services.json` - Service schema example
- And more...

## 🎯 Roadmap

- [ ] GraphQL API support
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] WhatsApp integration
- [ ] AI-powered job assignment
- [ ] Multi-language support
- [ ] Advanced reporting
- [ ] Subscription management

---

Built with ❤️ for modern service platforms
