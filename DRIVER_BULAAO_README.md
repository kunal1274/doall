# Driver Bulaao - Professional Driver On-Demand Service

## 🚗 Overview

Driver Bulaao is a comprehensive driver-on-demand service integrated into the Doall multi-tenant platform. It connects customers who need professional drivers for their personal vehicles with verified, skilled drivers through an intelligent dispatch system.

## ✨ Key Features

### For Customers

- **Multiple Service Types**: 4-hour, 8-hour, full-day, and outstation services
- **Vehicle Management**: Add and manage multiple personal vehicles
- **Smart Booking**: Easy booking with date/time slot selection
- **Trip PIN Security**: Secure 4-digit PIN verification for trip start
- **Real-time Tracking**: Track driver location during trips
- **Rating System**: Rate drivers after trip completion
- **Transparent Pricing**: Clear breakdown with base fare + 18% GST

### For Drivers

- **Online/Offline Toggle**: Control availability with location tracking
- **Trip Management**: Accept bookings, start/end trips with PIN verification
- **Earnings Dashboard**: View daily, weekly, and total earnings
- **Performance Metrics**: Track ratings and completed trips
- **Real-time Updates**: Receive booking notifications instantly
- **Auto Location Sync**: Location updates every 30 seconds when online

### For Dispatchers

- **Control Center**: Monitor all bookings and drivers in real-time
- **Live Map View**: See all online drivers and active trips
- **Driver Assignment**: Manually assign drivers to bookings
- **Dashboard Analytics**: View pending, active, completed stats
- **Driver Management**: Monitor driver status and performance
- **Revenue Tracking**: Track daily revenue and trip statistics

## 🏗️ Architecture

### Backend Structure

```
src/
├── models/
│   ├── Driver.js            # Driver profiles with licensing & performance
│   ├── Vehicle.js           # Customer vehicle registry
│   ├── DriverBooking.js     # Booking management with 12-status workflow
│   └── TripSession.js       # Real-time trip tracking with PIN
├── controllers/
│   ├── dispatcherController.js      # Dispatcher operations
│   ├── driverServiceController.js   # Driver app functionality
│   └── customerDriverController.js  # Customer booking management
└── routes/
    ├── dispatcher.routes.js         # /api/v1/driver-service/dispatcher/*
    ├── driverService.routes.js      # /api/v1/driver-service/drivers/*
    └── customerDriver.routes.js     # /api/v1/driver-service/customer/*
```

### Frontend Structure

```
public/
├── js/
│   ├── driverBulaao.js          # Customer booking interface
│   ├── driverDashboard.js       # Driver app
│   ├── dispatcherDashboard.js   # Dispatcher control center
│   ├── app.js                   # Main app (updated)
│   └── ui.js                    # UI manager (updated)
├── css/
│   └── styles.css               # Atomic Habits theme with toggle switches
└── index.html                   # Role-based navigation menus
```

## 📊 Database Models

### Driver Model

```javascript
{
  tenant_id: ObjectId,
  user_id: ObjectId,
  license_details: {
    license_number: String,
    issue_date: Date,
    expiry_date: Date,
    verification_status: ['pending', 'verified', 'rejected']
  },
  availability: {
    is_available: Boolean,
    current_status: ['offline', 'online', 'on_trip'],
    current_location: { type: 'Point', coordinates: [lng, lat] }
  },
  performance: {
    total_trips: Number,
    completed_trips: Number,
    cancelled_trips: Number,
    rating_avg: Number,
    rating_count: Number
  },
  earnings: {
    total_earnings: Number,
    pending_balance: Number,
    withdrawn: Number
  }
}
```

### Vehicle Model

```javascript
{
  tenant_id: ObjectId,
  customer_id: ObjectId,
  vehicle_type: ['car', 'suv', 'sedan', 'hatchback', 'luxury'],
  details: {
    brand: String,
    model: String,
    registration_number: String,
    fuel_type: String,
    transmission: String,
    year: Number,
    color: String
  },
  insurance: {
    policy_number: String,
    provider: String,
    expiry_date: Date
  },
  status: ['active', 'inactive', 'verification_pending']
}
```

### DriverBooking Model

```javascript
{
  tenant_id: ObjectId,
  booking_number: String,  // Auto-generated: DB{timestamp}{count}
  customer_id: ObjectId,
  driver_id: ObjectId,
  vehicle_id: ObjectId,
  service_type: ['4hr', '8hr', 'fullday', 'outstation'],
  status: [
    'requested',
    'searching_driver',
    'driver_assigned',
    'driver_arrived',
    'trip_started',
    'trip_in_progress',
    'trip_completed',
    'payment_pending',
    'payment_completed',
    'closed',
    'cancelled',
    'disputed'
  ],
  schedule: {
    scheduled_for: Date,
    preferred_time_slot: String
  },
  locations: {
    pickup: { address: String, lat: Number, lng: Number },
    drop: { address: String, lat: Number, lng: Number }
  },
  pricing: {
    base_fare: Number,  // 4hr:800, 8hr:1500, fullday:2000, outstation:2500
    gst: Number,        // 18%
    final_amount: Number
  },
  trip_details: {
    trip_pin: String,   // 4-digit PIN
    start_time: Date,
    end_time: Date,
    actual_duration: Number
  },
  ratings: {
    by_customer: { rating: Number, comment: String },
    by_driver: { rating: Number, comment: String }
  }
}
```

### TripSession Model

```javascript
{
  tenant_id: ObjectId,
  booking_id: ObjectId,
  driver_id: ObjectId,
  customer_id: ObjectId,
  trip_pin: String,  // Auto-generated 4-digit PIN
  session_data: {
    started_at: Date,
    ended_at: Date,
    start_location: { type: 'Point' },
    end_location: { type: 'Point' }
  },
  location_history: [{
    location: { type: 'Point' },
    timestamp: Date,
    speed: Number,
    heading: Number
  }],
  stops: [{
    location: { type: 'Point' },
    purpose: String,
    duration: Number
  }],
  status: ['active', 'paused', 'completed', 'cancelled']
}
```

## 🔌 API Endpoints

### Customer Endpoints (`/api/v1/driver-service/customer`)

- `GET /vehicles` - List customer's vehicles
- `POST /vehicles` - Add new vehicle
- `POST /bookings` - Create new booking
- `GET /bookings` - List all bookings
- `GET /bookings/:id` - Get booking details
- `POST /bookings/:id/cancel` - Cancel booking
- `POST /bookings/:id/rate` - Rate driver

### Driver Endpoints (`/api/v1/driver-service/drivers`)

- `GET /profile` - Get driver profile
- `PATCH /availability` - Update online/offline status
- `GET /active-trip` - Get current active trip
- `POST /bookings/:id/accept` - Accept booking
- `POST /trips/start` - Start trip (with PIN verification)
- `POST /trips/end` - End trip
- `POST /location/update` - Update current location
- `GET /earnings` - Get earnings data

### Dispatcher Endpoints (`/api/v1/driver-service/dispatcher`)

- `GET /stats` - Dashboard statistics
- `GET /bookings` - List all bookings (with filters)
- `POST /bookings/:id/assign` - Assign driver to booking
- `GET /drivers` - List drivers (with availability filter)
- `GET /map-data` - Get real-time map data

## 🎨 Theme & Design

### Atomic Habits Deep Red Theme

- **Primary**: #8B1C1C (Deep Red)
- **Primary Dark**: #6B0F0F
- **Primary Light**: #A52A2A
- **Accent Gold**: #D4AF37

### UI Components

- **Toggle Switch**: Modern sliding toggle for driver availability
- **Status Badges**: Color-coded booking statuses
- **Gradient Cards**: Deep red gradients for headers
- **Real-time Updates**: Auto-refresh every 30 seconds
- **Toast Notifications**: Success/error feedback
- **Modal Dialogs**: PIN input, driver assignment

## 🔐 Security Features

### Trip PIN Verification

- 4-digit PIN generated for each booking
- Displayed to customer after booking
- Required to start trip (prevents unauthorized starts)
- Validated by backend before trip start

### Authentication & Authorization

- JWT-based authentication
- Role-based access control (customer, driver, dispatcher)
- Tenant isolation (multi-tenant architecture)
- Route protection with middleware

### Data Privacy

- Driver location only tracked when online
- Customer data encrypted in transit
- Payment information handled securely
- License verification workflow

## 📱 PWA Features

### Installable

- App manifest with icons
- Add to home screen capability
- Full-screen mode support

### Offline Support

- Service worker caching
- Offline page fallback
- Background sync for location updates

### Push Notifications

- Booking notifications for drivers
- Driver assignment alerts for customers
- Trip status updates

## 🚀 Getting Started

### Prerequisites

- Node.js 14+
- MongoDB 4.4+
- Redis (optional, for caching)

### Installation

1. **Clone and Install**

```bash
cd /path/to/doall
npm install
```

2. **Environment Variables**

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/doall
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
```

3. **Start Server**

```bash
npm start
```

4. **Access Application**

- Frontend: http://localhost:5000
- API: http://localhost:5000/api/v1
- Health Check: http://localhost:5000/health

### Creating Test Users

```javascript
// Customer
{
  "email": "customer@test.com",
  "password": "password123",
  "profile": {
    "first_name": "John",
    "last_name": "Customer",
    "phone": "+919876543210"
  },
  "roles": [{ "role": "customer" }]
}

// Driver
{
  "email": "driver@test.com",
  "password": "password123",
  "profile": {
    "first_name": "Mike",
    "last_name": "Driver",
    "phone": "+919876543211"
  },
  "roles": [{ "role": "driver" }]
}

// Dispatcher
{
  "email": "dispatcher@test.com",
  "password": "password123",
  "profile": {
    "first_name": "Sarah",
    "last_name": "Dispatcher",
    "phone": "+919876543212"
  },
  "roles": [{ "role": "dispatcher" }]
}
```

## 📈 Usage Workflow

### Customer Flow

1. Login → Navigate to "Driver Bulaao"
2. Add vehicle (if first time)
3. Select service type (4hr/8hr/fullday/outstation)
4. Choose vehicle, date, time slot
5. Enter pickup/drop locations
6. Confirm booking
7. Receive booking confirmation with trip PIN
8. Wait for driver assignment
9. Share PIN with driver to start trip
10. Track trip in real-time
11. Trip ends, payment processed
12. Rate driver

### Driver Flow

1. Login → Navigate to "Driver Dashboard"
2. Toggle online/offline
3. Receive booking notification
4. Accept booking
5. Navigate to pickup location
6. Arrive, ask customer for PIN
7. Enter PIN to start trip
8. Drive to destination(s)
9. End trip when complete
10. View earnings
11. Receive payment

### Dispatcher Flow

1. Login → Navigate to "Control Center"
2. View dashboard stats
3. Monitor active bookings
4. See online drivers on map
5. Manually assign drivers if needed
6. Track all trips in real-time
7. Resolve any issues
8. View analytics and reports

## 🔧 Customization

### Pricing Configuration

Edit [customerDriverController.js](src/controllers/customerDriverController.js):

```javascript
const baseFares = {
  "4hr": 800,
  "8hr": 1500,
  fullday: 2000,
  outstation: 2500,
};
const gstRate = 0.18;
```

### Service Types

Edit [driverBulaao.js](public/js/driverBulaao.js):

```javascript
<option value="4hr">4 Hours - ₹800</option>
<option value="8hr">8 Hours - ₹1,500</option>
<option value="fullday">Full Day - ₹2,000</option>
<option value="outstation">Outstation - ₹2,500+</option>
```

### Location Tracking Interval

Edit [driverDashboard.js](public/js/driverDashboard.js):

```javascript
// Update location every 30 seconds (change to desired interval)
this.updateInterval = setInterval(async () => {
  // ...location update code
}, 30000); // 30000ms = 30 seconds
```

## 🐛 Troubleshooting

### Common Issues

**1. Routes not working**

- Check server.js has the route mounts:

```javascript
app.use(
  "/api/v1/driver-service/dispatcher",
  require("./src/routes/dispatcher.routes")
);
app.use(
  "/api/v1/driver-service/drivers",
  require("./src/routes/driverService.routes")
);
app.use(
  "/api/v1/driver-service/customer",
  require("./src/routes/customerDriver.routes")
);
```

**2. Menu sections not showing**

- Check user roles in MongoDB
- Verify ui.js role detection logic
- Check HTML has correct menu section IDs

**3. Location tracking not working**

- Enable browser location permissions
- Check HTTPS (required for geolocation API)
- Verify driver is online

**4. PIN verification failing**

- Check TripSession model has pre-save hook
- Verify PIN is being generated correctly
- Check customer received PIN in toast notification

## 📝 Future Enhancements

### Planned Features

- [ ] Google Maps integration for live tracking
- [ ] In-app payment gateway integration
- [ ] Driver earnings withdrawal system
- [ ] Automated driver matching based on location
- [ ] Customer trip history with analytics
- [ ] Driver shift management
- [ ] Multi-stop trip support
- [ ] Incident reporting system
- [ ] Insurance claim integration
- [ ] Driver training and certification
- [ ] Customer loyalty program
- [ ] Surge pricing during peak hours

### Technical Improvements

- [ ] Redis caching for driver locations
- [ ] WebSocket optimization for real-time updates
- [ ] Database indexing for performance
- [ ] API rate limiting per user
- [ ] Comprehensive error logging
- [ ] Automated testing suite
- [ ] CI/CD pipeline
- [ ] Docker containerization
- [ ] Kubernetes orchestration
- [ ] Load balancing setup

## 🤝 Contributing

This is a proprietary system developed with Claude Sonnet 4.5. For any modifications or enhancements, ensure to:

1. Follow existing code patterns
2. Maintain Atomic Habits theme consistency
3. Test all three roles (customer, driver, dispatcher)
4. Update documentation
5. Maintain multi-tenant isolation

## 📄 License

Proprietary - All rights reserved

## 📞 Support

For technical support or queries, contact the development team.

---

**Built with ❤️ using Claude Sonnet 4.5**

_"Small changes, remarkable results" - Atomic Habits_
